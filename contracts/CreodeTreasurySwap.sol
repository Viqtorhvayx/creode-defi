// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CreodeTreasurySwap
 * @author Viqtorhvayx
 * @notice A treasury-backed swap that implements the same interface the
 *         yield vault expects (getAmountOut / swap), but instead of an AMM
 *         pool it prices swaps from an admin/keeper oracle and sources the
 *         output token from the protocol treasury. This gives deep, clean
 *         swaps on every pair with no pool seeding and no native-HBAR
 *         liquidity bottleneck — the input is forwarded to the treasury and
 *         the output is pulled from it (or paid from a small HBAR reserve for
 *         HBAR-output swaps). Prices are USD with 8 decimals.
 */
contract CreodeTreasurySwap is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public constant HBAR = address(0);
    uint256 public constant PRICE_SCALE = 1e8; // USD price fixed-point (8 dp)

    address public treasury;
    mapping(address => uint256) public priceE8;   // token => USD price (8 dp)
    mapping(address => uint8) public decimalsOf;   // token => decimals (HBAR = 8)

    event TreasuryUpdated(address indexed treasury);
    event PriceSet(address indexed token, uint256 priceE8, uint8 decimals);
    event Swap(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut, address indexed to);

    constructor(address admin, address _treasury) {
        require(admin != address(0) && _treasury != address(0), "zero");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function setTreasury(address _t) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_t != address(0), "zero");
        treasury = _t;
        emit TreasuryUpdated(_t);
    }

    /// @notice Register a token's USD price (8 dp) and decimals. HBAR uses 8.
    function setPrice(address token, uint256 _priceE8, uint8 _decimals) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_priceE8 > 0, "price");
        priceE8[token] = _priceE8;
        decimalsOf[token] = _decimals;
        emit PriceSet(token, _priceE8, _decimals);
    }

    function setPrices(address[] calldata tokens, uint256[] calldata prices, uint8[] calldata decs)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(tokens.length == prices.length && tokens.length == decs.length, "len");
        for (uint256 i = 0; i < tokens.length; i++) {
            require(prices[i] > 0, "price");
            priceE8[tokens[i]] = prices[i];
            decimalsOf[tokens[i]] = decs[i];
            emit PriceSet(tokens[i], prices[i], decs[i]);
        }
    }

    /// @notice Oracle-priced output amount (no slippage / price impact).
    function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) public view returns (uint256) {
        uint256 pIn = priceE8[tokenIn];
        uint256 pOut = priceE8[tokenOut];
        require(pIn > 0 && pOut > 0, "no price");
        uint256 decIn = decimalsOf[tokenIn];
        uint256 decOut = decimalsOf[tokenOut];
        // out = amountIn * pIn * 10^decOut / (pOut * 10^decIn)
        return (amountIn * pIn * (10 ** decOut)) / (pOut * (10 ** decIn));
    }

    /**
     * @notice Swap `amountIn` of `tokenIn` for `tokenOut`, delivering output to
     *         `to`. Input is forwarded to the treasury; output is pulled from
     *         the treasury (ERC20) or paid from this contract's HBAR reserve.
     */
    function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minOut, address to)
        external
        payable
        nonReentrant
        returns (uint256 amountOut)
    {
        require(tokenIn != tokenOut, "same");
        require(to != address(0), "to");
        amountOut = getAmountOut(tokenIn, tokenOut, amountIn);
        require(amountOut >= minOut, "slippage");

        // Take input -> treasury.
        if (tokenIn == HBAR) {
            require(msg.value >= amountIn, "hbar in");
            (bool ok, ) = payable(treasury).call{ value: amountIn }("");
            require(ok, "hbar->treasury");
        } else {
            require(msg.value == 0, "no hbar");
            IERC20(tokenIn).safeTransferFrom(msg.sender, treasury, amountIn);
        }

        // Deliver output.
        if (tokenOut == HBAR) {
            (bool ok2, ) = payable(to).call{ value: amountOut }("");
            require(ok2, "hbar out");
        } else {
            IERC20(tokenOut).safeTransferFrom(treasury, to, amountOut);
        }

        emit Swap(tokenIn, tokenOut, amountIn, amountOut, to);
    }

    /// @notice Fund the HBAR reserve used to pay HBAR-output swaps.
    function fundHbarReserve() external payable {}
    function hbarBalance() external view returns (uint256) { return address(this).balance; }
    receive() external payable {}
}
