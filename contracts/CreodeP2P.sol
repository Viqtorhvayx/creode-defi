// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CreodeP2P
 * @author Viqtorhvayx
 * @notice Peer-to-peer spot order book with on-chain escrow for the Creode
 *         P2P tab on Hedera. There is no house/pool — every trade matches one
 *         user's order against another's.
 *
 *  - LIMIT: a maker posts an order and the sell-side tokens are escrowed by
 *    this contract until the order is filled, cancelled, or expires. Native
 *    HBAR (token == address(0)) and HTS/ERC20 tokens are supported uniformly.
 *
 *  - MARKET: a taker fills a resting order immediately (`fillOrder`). Off-chain
 *    the UI/relayer picks the best-priced open orders; this contract only
 *    settles the chosen fills trustlessly. Partial fills are supported.
 *
 *  On each fill the taker pays the buy side straight to the maker; the escrowed
 *  sell side is released to the taker minus a small protocol fee (BPS) routed
 *  to the treasury.
 */
contract CreodeP2P is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    address public constant HBAR = address(0);
    uint256 public constant BPS = 10_000;
    uint256 public constant MAX_FEE_BPS = 100; // 1.00% hard cap

    address public treasury;
    uint256 public feeBps = 20; // 0.20% taker fee

    struct Order {
        address maker;
        address sellToken;   // escrowed token the maker gives (address(0)=HBAR)
        address buyToken;    // token the maker wants
        uint256 sellAmount;  // original sell size
        uint256 buyAmount;   // original buy size (price = buyAmount/sellAmount)
        uint256 sellRemaining;
        uint256 buyRemaining;
        uint256 expiry;      // 0 = never expires
        bool active;
    }

    uint256 public nextOrderId;
    mapping(uint256 => Order) public orders;
    mapping(address => uint256[]) private _userOrders;

    event TreasuryUpdated(address indexed treasury);
    event FeeUpdated(uint256 feeBps);
    event OrderCreated(
        uint256 indexed id,
        address indexed maker,
        address sellToken,
        uint256 sellAmount,
        address buyToken,
        uint256 buyAmount,
        uint256 expiry
    );
    event OrderFilled(
        uint256 indexed id,
        address indexed taker,
        uint256 buyPaid,
        uint256 sellReceived,
        uint256 fee
    );
    event OrderCancelled(uint256 indexed id, uint256 refunded);

    constructor(address admin, address _treasury) {
        require(admin != address(0) && _treasury != address(0), "zero");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    // ── Admin ────────────────────────────────────────────────────────────
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    function setTreasury(address _t) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_t != address(0), "zero");
        treasury = _t;
        emit TreasuryUpdated(_t);
    }

    function setFee(uint256 _feeBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_feeBps <= MAX_FEE_BPS, "fee cap");
        feeBps = _feeBps;
        emit FeeUpdated(_feeBps);
    }

    // ── Custody helpers ──────────────────────────────────────────────────
    function _pullFrom(address token, address from, uint256 amount, uint256 hbarValue) private {
        if (token == HBAR) {
            require(hbarValue >= amount, "hbar in");
        } else {
            IERC20(token).safeTransferFrom(from, address(this), amount);
        }
    }

    function _send(address token, address to, uint256 amount) private {
        if (amount == 0) return;
        if (token == HBAR) {
            (bool ok, ) = payable(to).call{ value: amount }("");
            require(ok, "hbar send");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    // ── Limit: create order (escrow sell side) ───────────────────────────
    function createLimitOrder(
        address sellToken,
        uint256 sellAmount,
        address buyToken,
        uint256 buyAmount,
        uint256 expiry
    ) external payable nonReentrant whenNotPaused returns (uint256 id) {
        require(sellToken != buyToken, "same token");
        require(sellAmount > 0 && buyAmount > 0, "zero");
        if (sellToken == HBAR) {
            require(msg.value == sellAmount, "hbar amount");
        } else {
            require(msg.value == 0, "no hbar");
        }

        _pullFrom(sellToken, msg.sender, sellAmount, msg.value);

        id = nextOrderId++;
        orders[id] = Order({
            maker: msg.sender,
            sellToken: sellToken,
            buyToken: buyToken,
            sellAmount: sellAmount,
            buyAmount: buyAmount,
            sellRemaining: sellAmount,
            buyRemaining: buyAmount,
            expiry: expiry,
            active: true
        });
        _userOrders[msg.sender].push(id);

        emit OrderCreated(id, msg.sender, sellToken, sellAmount, buyToken, buyAmount, expiry);
    }

    // ── Market: fill a resting order ─────────────────────────────────────
    /**
     * @notice Fill `orderId` by paying `buyPay` of its buy token. The taker
     *         receives the proportional escrowed sell tokens (minus fee).
     *         For an HBAR buy token, send `buyPay` as msg.value.
     */
    function fillOrder(uint256 orderId, uint256 buyPay, uint256 minReceive)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        Order storage o = orders[orderId];
        require(o.active, "inactive");
        require(o.expiry == 0 || block.timestamp < o.expiry, "expired");
        require(msg.sender != o.maker, "self fill");
        require(buyPay > 0 && buyPay <= o.buyRemaining, "bad amount");

        uint256 sellOut = (buyPay * o.sellAmount) / o.buyAmount;
        require(sellOut > 0 && sellOut <= o.sellRemaining, "dust");

        o.buyRemaining -= buyPay;
        o.sellRemaining -= sellOut;
        if (o.buyRemaining == 0 || o.sellRemaining == 0) o.active = false;

        // Taker pays the buy side straight to the maker.
        if (o.buyToken == HBAR) {
            require(msg.value == buyPay, "hbar pay");
            _send(HBAR, o.maker, buyPay);
        } else {
            require(msg.value == 0, "no hbar");
            IERC20(o.buyToken).safeTransferFrom(msg.sender, o.maker, buyPay);
        }

        // Release escrowed sell side to the taker, minus protocol fee.
        uint256 fee = (sellOut * feeBps) / BPS;
        uint256 takerGets = sellOut - fee;
        require(takerGets >= minReceive, "slippage");
        _send(o.sellToken, treasury, fee);
        _send(o.sellToken, msg.sender, takerGets);

        emit OrderFilled(orderId, msg.sender, buyPay, takerGets, fee);
    }

    // ── Cancel (maker, or anyone once expired) ───────────────────────────
    function cancelOrder(uint256 orderId) external nonReentrant {
        Order storage o = orders[orderId];
        require(o.active, "inactive");
        bool expired = o.expiry != 0 && block.timestamp >= o.expiry;
        require(msg.sender == o.maker || expired, "not maker");

        uint256 refund = o.sellRemaining;
        o.sellRemaining = 0;
        o.buyRemaining = 0;
        o.active = false;

        _send(o.sellToken, o.maker, refund);
        emit OrderCancelled(orderId, refund);
    }

    // ── Views ────────────────────────────────────────────────────────────
    function getOrder(uint256 id) external view returns (Order memory) {
        return orders[id];
    }

    function getUserOrders(address user) external view returns (uint256[] memory) {
        return _userOrders[user];
    }

    /// @notice Active orders, newest-first, up to `limit` (0 = all).
    function getOpenOrders(uint256 limit) external view returns (uint256[] memory ids, Order[] memory list) {
        uint256 count;
        for (uint256 i = 0; i < nextOrderId; i++) {
            if (orders[i].active) count++;
        }
        if (limit > 0 && limit < count) count = limit;
        ids = new uint256[](count);
        list = new Order[](count);
        uint256 k;
        for (uint256 j = nextOrderId; j > 0 && k < count; j--) {
            uint256 idx = j - 1;
            if (orders[idx].active) {
                ids[k] = idx;
                list[k] = orders[idx];
                k++;
            }
        }
    }

    receive() external payable {}
}
