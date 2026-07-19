// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ICreodeSwapRouter {
    function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) external view returns (uint256);
    function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minOut, address to)
        external
        payable
        returns (uint256 amountOut);
}

/**
 * @title CreodeYieldVaultV2
 * @author Viqtorhvayx
 * @notice Phase 2 of the Creode Earn / Yield Hub: single-sided "zap in" that
 *         performs a REAL on-chain swap through the CreodeSwapRouter, so a
 *         position genuinely holds BOTH tokens of the pair.
 *
 *  - Each strategy has two tokens (tokenA, tokenB). Setting tokenB == tokenA
 *    makes it a single-sided strategy (no swap).
 *  - zapIn: the user supplies one accepted token; ~half is swapped to the
 *    other side via the router; the position holds both real balances.
 *  - Each side accrues yield independently at the strategy APY, funded from
 *    the treasury (ERC20 allowance) or the HBAR reserve (native) — the proven
 *    Creode yield model. Withdraw returns both sides + their yield.
 *
 *  Native HBAR uses token == address(0); inside the EVM its amounts are in
 *  tinybar, consistent across custody, swap value, and payout.
 */
contract CreodeYieldVaultV2 is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    address public constant HBAR = address(0);
    uint256 public constant BPS = 10_000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    address public treasury;
    ICreodeSwapRouter public router;

    struct Strategy {
        string name;
        address tokenA;
        address tokenB; // == tokenA for single-sided (no swap)
        uint256 apyBps;
        bool active;
        bool exists;
    }

    struct Position {
        uint256 amtA;
        uint256 amtB;
        uint256 accruedA;
        uint256 accruedB;
        uint256 lastUpdate;
    }

    struct PositionView {
        uint256 strategyId;
        string name;
        address tokenA;
        address tokenB;
        uint256 apyBps;
        uint256 amtA;
        uint256 amtB;
        uint256 yieldA;
        uint256 yieldB;
        bool active;
    }

    uint256 public strategyCount;
    mapping(uint256 => Strategy) public strategies;
    mapping(address => mapping(uint256 => Position)) private _positions;
    mapping(address => uint256[]) private _userStrategies;
    mapping(address => mapping(uint256 => bool)) private _hasPosition;

    event TreasuryUpdated(address indexed treasury);
    event RouterUpdated(address indexed router);
    event StrategyCreated(uint256 indexed id, string name, address tokenA, address tokenB, uint256 apyBps);
    event StrategyApyUpdated(uint256 indexed id, uint256 apyBps);
    event StrategyActiveUpdated(uint256 indexed id, bool active);
    event ZappedIn(address indexed user, uint256 indexed id, address tokenIn, uint256 amountIn, uint256 amtA, uint256 amtB);
    event Withdrawn(address indexed user, uint256 indexed id, uint256 outA, uint256 outB);

    constructor(address admin, address _treasury, address _router) {
        require(admin != address(0) && _treasury != address(0) && _router != address(0), "zero addr");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        treasury = _treasury;
        router = ICreodeSwapRouter(_router);
        emit TreasuryUpdated(_treasury);
        emit RouterUpdated(_router);
    }

    // ── Admin ────────────────────────────────────────────────────────────
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    function setTreasury(address _t) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_t != address(0), "zero");
        treasury = _t;
        emit TreasuryUpdated(_t);
    }

    function setRouter(address _r) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_r != address(0), "zero");
        router = ICreodeSwapRouter(_r);
        emit RouterUpdated(_r);
    }

    function createStrategy(string calldata name, address tokenA, address tokenB, uint256 apyBps)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (uint256 id)
    {
        id = strategyCount++;
        strategies[id] = Strategy({ name: name, tokenA: tokenA, tokenB: tokenB, apyBps: apyBps, active: true, exists: true });
        emit StrategyCreated(id, name, tokenA, tokenB, apyBps);
    }

    function setStrategyApy(uint256 id, uint256 apyBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(strategies[id].exists, "unknown");
        strategies[id].apyBps = apyBps;
        emit StrategyApyUpdated(id, apyBps);
    }

    function setStrategyActive(uint256 id, bool active) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(strategies[id].exists, "unknown");
        strategies[id].active = active;
        emit StrategyActiveUpdated(id, active);
    }

    // ── Accrual ──────────────────────────────────────────────────────────
    function _yield(uint256 amt, uint256 apyBps, uint256 dt) private pure returns (uint256) {
        return (amt * apyBps * dt) / (BPS * SECONDS_PER_YEAR);
    }

    function _accrue(Position storage pos, uint256 apyBps) private {
        if (pos.lastUpdate > 0) {
            uint256 dt = block.timestamp - pos.lastUpdate;
            if (dt > 0) {
                if (pos.amtA > 0) pos.accruedA += _yield(pos.amtA, apyBps, dt);
                if (pos.amtB > 0) pos.accruedB += _yield(pos.amtB, apyBps, dt);
            }
        }
        pos.lastUpdate = block.timestamp;
    }

    // ── Zap in (real on-chain swap) ──────────────────────────────────────
    /**
     * @param id         Strategy id.
     * @param tokenIn    One of the strategy's two tokens (address(0) = HBAR).
     * @param amountIn   Token amount (ignored for HBAR — msg.value is used).
     * @param minSwapOut Slippage floor for the ~half swap (0 to disable).
     */
    function zapIn(uint256 id, address tokenIn, uint256 amountIn, uint256 minSwapOut)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        Strategy memory s = strategies[id];
        require(s.exists && s.active, "inactive");
        require(tokenIn == s.tokenA || tokenIn == s.tokenB, "bad token");

        // Take custody of the input.
        uint256 gross;
        if (tokenIn == HBAR) {
            require(msg.value > 0, "no HBAR");
            gross = msg.value;
        } else {
            require(msg.value == 0, "no HBAR for token");
            require(amountIn > 0, "zero");
            gross = amountIn;
            IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        }

        Position storage pos = _positions[msg.sender][id];
        _accrue(pos, s.apyBps);

        uint256 addA;
        uint256 addB;
        if (s.tokenA == s.tokenB) {
            // Single-sided: no swap.
            addA = gross;
        } else {
            address tokenOut = tokenIn == s.tokenA ? s.tokenB : s.tokenA;
            uint256 half = gross / 2;
            uint256 keep = gross - half;
            uint256 got = _swap(tokenIn, tokenOut, half, minSwapOut);
            if (tokenIn == s.tokenA) { addA = keep; addB = got; }
            else { addB = keep; addA = got; }
        }

        pos.amtA += addA;
        pos.amtB += addB;

        if (!_hasPosition[msg.sender][id]) {
            _hasPosition[msg.sender][id] = true;
            _userStrategies[msg.sender].push(id);
        }

        emit ZappedIn(msg.sender, id, tokenIn, gross, addA, addB);
    }

    function _swap(address tokenIn, address tokenOut, uint256 amount, uint256 minOut) private returns (uint256) {
        if (tokenIn == HBAR) {
            return router.swap{ value: amount }(HBAR, tokenOut, amount, minOut, address(this));
        }
        IERC20(tokenIn).forceApprove(address(router), amount);
        return router.swap(tokenIn, tokenOut, amount, minOut, address(this));
    }

    // ── Withdraw (full exit of a position) ───────────────────────────────
    function withdrawAll(uint256 id) external nonReentrant {
        Strategy memory s = strategies[id];
        require(s.exists, "unknown");
        Position storage pos = _positions[msg.sender][id];
        _accrue(pos, s.apyBps);

        uint256 principalA = pos.amtA;
        uint256 principalB = pos.amtB;
        uint256 yieldA = pos.accruedA;
        uint256 yieldB = pos.accruedB;
        require(principalA + principalB + yieldA + yieldB > 0, "empty");

        pos.amtA = 0; pos.amtB = 0; pos.accruedA = 0; pos.accruedB = 0;

        _payout(s.tokenA, msg.sender, principalA, yieldA);
        if (s.tokenB != s.tokenA) {
            _payout(s.tokenB, msg.sender, principalB, yieldB);
        }

        emit Withdrawn(msg.sender, id, principalA + yieldA, principalB + yieldB);
    }

    /// @dev principal from vault custody; yield from treasury (ERC20) / reserve (HBAR).
    function _payout(address token, address to, uint256 principal, uint256 yieldAmt) private {
        if (token == HBAR) {
            uint256 total = principal + yieldAmt;
            if (total > 0) {
                (bool ok, ) = payable(to).call{ value: total }("");
                require(ok, "HBAR payout failed");
            }
        } else {
            if (principal > 0) IERC20(token).safeTransfer(to, principal);
            if (yieldAmt > 0) IERC20(token).safeTransferFrom(treasury, to, yieldAmt);
        }
    }

    // ── Views ────────────────────────────────────────────────────────────
    function pendingYield(address user, uint256 id) public view returns (uint256 yieldA, uint256 yieldB) {
        Position memory pos = _positions[user][id];
        yieldA = pos.accruedA;
        yieldB = pos.accruedB;
        if (pos.lastUpdate > 0) {
            uint256 dt = block.timestamp - pos.lastUpdate;
            uint256 apy = strategies[id].apyBps;
            if (pos.amtA > 0) yieldA += _yield(pos.amtA, apy, dt);
            if (pos.amtB > 0) yieldB += _yield(pos.amtB, apy, dt);
        }
    }

    function getPosition(address user, uint256 id) external view returns (Position memory) {
        return _positions[user][id];
    }

    function getUserPositions(address user) external view returns (PositionView[] memory views) {
        uint256[] memory ids = _userStrategies[user];
        views = new PositionView[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            Position memory pos = _positions[user][id];
            Strategy memory s = strategies[id];
            (uint256 yA, uint256 yB) = pendingYield(user, id);
            views[i] = PositionView({
                strategyId: id,
                name: s.name,
                tokenA: s.tokenA,
                tokenB: s.tokenB,
                apyBps: s.apyBps,
                amtA: pos.amtA,
                amtB: pos.amtB,
                yieldA: yA,
                yieldB: yB,
                active: s.active
            });
        }
    }

    function getStrategies()
        external
        view
        returns (uint256[] memory ids, string[] memory names, address[] memory tokenAs, address[] memory tokenBs, uint256[] memory apys, bool[] memory actives)
    {
        uint256 n = strategyCount;
        ids = new uint256[](n);
        names = new string[](n);
        tokenAs = new address[](n);
        tokenBs = new address[](n);
        apys = new uint256[](n);
        actives = new bool[](n);
        for (uint256 i = 0; i < n; i++) {
            Strategy memory s = strategies[i];
            ids[i] = i;
            names[i] = s.name;
            tokenAs[i] = s.tokenA;
            tokenBs[i] = s.tokenB;
            apys[i] = s.apyBps;
            actives[i] = s.active;
        }
    }

    // ── HBAR reserve ─────────────────────────────────────────────────────
    function hbarBalance() external view returns (uint256) { return address(this).balance; }
    function fundHbarReserve() external payable {}
    receive() external payable {}
}
