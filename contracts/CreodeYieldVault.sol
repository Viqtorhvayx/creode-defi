// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CreodeYieldVault
 * @author Viqtorhvayx
 * @notice Liquid, multi-strategy, single-sided yield vault for the Creode
 *         Earn / Yield Hub on the Hedera network (Phase 1).
 *
 * Design:
 *  - A "strategy" is a branded pool (e.g. "HBAR-SAUCE") with an APY (in BPS)
 *    and a set of accepted single-sided deposit tokens. Users supply ONE of
 *    those tokens; the vault custodies it and accrues yield continuously.
 *
 *  - Positions are keyed per (user, strategyId, token). There is no lock and
 *    no penalty — deposits and withdrawals are liquid at any time.
 *
 *  - Yield accrues linearly at the strategy APY and is funded the same way as
 *    the savings Vault: HTS/ERC20 yield is pulled from the Treasury via
 *    allowance (`safeTransferFrom`); native-HBAR yield is paid from the
 *    vault's own HBAR reserve (`fundHbarReserve` / `receive`). Principal is
 *    always custodied by the vault and returned from its own balance.
 *
 *  - Percentages use Basis Points (BPS): 10_000 = 100%.
 *
 * Note: this is the real on-chain accounting layer. Routing supplied capital
 * into an external DEX (SaucerSwap V2) and auto-compounding via a keeper are
 * later phases; from the user's perspective deposits, positions, accrued
 * yield and withdrawals are all genuine on-chain state today.
 */
contract CreodeYieldVault is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────────────

    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    /// @dev Native HBAR is represented by the zero address.
    address public constant HBAR = address(0);

    // ─────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────

    struct Strategy {
        string name; // display name, e.g. "HBAR-SAUCE"
        uint256 apyBps; // net APY in basis points
        bool active; // deposits allowed while true
        bool exists; // set once created
    }

    struct Position {
        uint256 principal; // supplied amount still in the vault
        uint256 accrued; // yield settled but not yet claimed
        uint256 lastUpdate; // timestamp of the last accrual
    }

    /// @dev A user's position handle, used for enumeration by the UI.
    struct PosKey {
        uint256 strategyId;
        address token;
    }

    /// @dev Flat view row returned to the UI for a user's position.
    struct PositionView {
        uint256 strategyId;
        string name;
        address token;
        uint256 apyBps;
        uint256 principal;
        uint256 pendingYield;
        bool active;
    }

    // ─────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Protocol treasury: funds HTS/ERC20 yield via allowance.
    address public treasury;

    /// @notice Monotonic strategy id counter.
    uint256 public strategyCount;

    /// @notice strategyId => Strategy config.
    mapping(uint256 => Strategy) public strategies;

    /// @notice strategyId => accepted deposit tokens (enumeration).
    mapping(uint256 => address[]) private _strategyTokens;

    /// @notice strategyId => token => accepted.
    mapping(uint256 => mapping(address => bool)) public strategyAccepts;

    /// @notice user => strategyId => token => Position.
    mapping(address => mapping(uint256 => mapping(address => Position))) private _positions;

    /// @notice user => list of their position handles.
    mapping(address => PosKey[]) private _userPositions;

    /// @notice user => strategyId => token => already tracked in _userPositions.
    mapping(address => mapping(uint256 => mapping(address => bool))) private _hasPosition;

    // ─────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────

    event TreasuryUpdated(address indexed treasury);
    event StrategyCreated(uint256 indexed strategyId, string name, uint256 apyBps);
    event StrategyApyUpdated(uint256 indexed strategyId, uint256 apyBps);
    event StrategyActiveUpdated(uint256 indexed strategyId, bool active);
    event StrategyTokenUpdated(uint256 indexed strategyId, address indexed token, bool accepted);

    event Deposited(address indexed user, uint256 indexed strategyId, address indexed token, uint256 amount);
    event Withdrawn(
        address indexed user,
        uint256 indexed strategyId,
        address indexed token,
        uint256 principalOut,
        uint256 yieldOut
    );
    event YieldClaimed(address indexed user, uint256 indexed strategyId, address indexed token, uint256 yieldOut);

    // ─────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────

    constructor(address _admin, address _treasury) {
        require(_admin != address(0), "Admin is zero address");
        require(_treasury != address(0), "Treasury is zero address");
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Admin controls (RBAC)
    // ─────────────────────────────────────────────────────────────────────

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function setTreasury(address _treasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_treasury != address(0), "Treasury is zero address");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    /**
     * @notice Create a strategy and set its accepted deposit tokens in one call.
     * @param name   Display name, e.g. "HBAR-SAUCE".
     * @param apyBps Net APY in basis points.
     * @param tokens Accepted single-sided deposit tokens (address(0) = HBAR).
     * @return strategyId The id of the newly created strategy.
     */
    function createStrategy(string calldata name, uint256 apyBps, address[] calldata tokens)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (uint256 strategyId)
    {
        strategyId = strategyCount++;
        strategies[strategyId] = Strategy({ name: name, apyBps: apyBps, active: true, exists: true });
        emit StrategyCreated(strategyId, name, apyBps);
        for (uint256 i = 0; i < tokens.length; i++) {
            _setStrategyToken(strategyId, tokens[i], true);
        }
    }

    function setStrategyApy(uint256 strategyId, uint256 apyBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(strategies[strategyId].exists, "Unknown strategy");
        strategies[strategyId].apyBps = apyBps;
        emit StrategyApyUpdated(strategyId, apyBps);
    }

    function setStrategyActive(uint256 strategyId, bool active) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(strategies[strategyId].exists, "Unknown strategy");
        strategies[strategyId].active = active;
        emit StrategyActiveUpdated(strategyId, active);
    }

    function setStrategyToken(uint256 strategyId, address token, bool accepted)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(strategies[strategyId].exists, "Unknown strategy");
        _setStrategyToken(strategyId, token, accepted);
    }

    function _setStrategyToken(uint256 strategyId, address token, bool accepted) private {
        if (accepted && !strategyAccepts[strategyId][token]) {
            _strategyTokens[strategyId].push(token);
        }
        strategyAccepts[strategyId][token] = accepted;
        emit StrategyTokenUpdated(strategyId, token, accepted);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Accrual math
    // ─────────────────────────────────────────────────────────────────────

    function _linearYield(uint256 principal, uint256 apyBps, uint256 elapsedSeconds)
        private
        pure
        returns (uint256)
    {
        return (principal * apyBps * elapsedSeconds) / (BPS_DENOMINATOR * SECONDS_PER_YEAR);
    }

    /// @dev Settle time-based yield into `pos.accrued` and stamp lastUpdate.
    function _accrue(Position storage pos, uint256 apyBps) private {
        if (pos.principal > 0 && pos.lastUpdate > 0) {
            uint256 elapsed = block.timestamp - pos.lastUpdate;
            if (elapsed > 0) {
                pos.accrued += _linearYield(pos.principal, apyBps, elapsed);
            }
        }
        pos.lastUpdate = block.timestamp;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Deposit (single-sided zap-in)
    // ─────────────────────────────────────────────────────────────────────

    /**
     * @notice Supply `amount` of `token` into strategy `strategyId`.
     * @dev For ERC20/HTS tokens, requires prior approval; for native HBAR pass
     *      `token = address(0)` and send HBAR as msg.value (amount is ignored).
     */
    function deposit(uint256 strategyId, address token, uint256 amount)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        Strategy memory s = strategies[strategyId];
        require(s.exists && s.active, "Strategy inactive");
        require(strategyAccepts[strategyId][token], "Token not accepted");

        uint256 gross;
        if (token == HBAR) {
            require(msg.value > 0, "No HBAR sent");
            gross = msg.value;
        } else {
            require(msg.value == 0, "No HBAR for token deposit");
            require(amount > 0, "Amount must be > 0");
            gross = amount;
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }

        Position storage pos = _positions[msg.sender][strategyId][token];
        _accrue(pos, s.apyBps);
        pos.principal += gross;

        if (!_hasPosition[msg.sender][strategyId][token]) {
            _hasPosition[msg.sender][strategyId][token] = true;
            _userPositions[msg.sender].push(PosKey({ strategyId: strategyId, token: token }));
        }

        emit Deposited(msg.sender, strategyId, token, gross);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Withdraw / claim
    // ─────────────────────────────────────────────────────────────────────

    /**
     * @notice Withdraw `amount` of principal from a position and claim all
     *         accrued yield in the same transaction.
     * @dev Pass amount = 0 to claim yield only. Principal comes from the
     *      vault's custody; yield from the Treasury (ERC20) or HBAR reserve.
     */
    function withdraw(uint256 strategyId, address token, uint256 amount) public nonReentrant {
        Strategy memory s = strategies[strategyId];
        require(s.exists, "Unknown strategy");

        Position storage pos = _positions[msg.sender][strategyId][token];
        _accrue(pos, s.apyBps);
        require(amount <= pos.principal, "Amount exceeds principal");

        uint256 yieldOut = pos.accrued;
        pos.accrued = 0;
        pos.principal -= amount;

        _payout(token, msg.sender, amount, yieldOut);

        if (amount > 0) {
            emit Withdrawn(msg.sender, strategyId, token, amount, yieldOut);
        } else {
            emit YieldClaimed(msg.sender, strategyId, token, yieldOut);
        }
    }

    /// @notice Withdraw the entire principal of a position plus all yield.
    function withdrawAll(uint256 strategyId, address token) external {
        withdraw(strategyId, token, _positions[msg.sender][strategyId][token].principal);
    }

    /// @notice Claim only the accrued yield of a position.
    function claimYield(uint256 strategyId, address token) external {
        withdraw(strategyId, token, 0);
    }

    /// @dev Pay `principalOut` (from custody) + `yieldOut` (treasury/reserve).
    function _payout(address token, address to, uint256 principalOut, uint256 yieldOut) private {
        if (token == HBAR) {
            uint256 total = principalOut + yieldOut;
            if (total > 0) {
                (bool ok, ) = payable(to).call{ value: total }("");
                require(ok, "HBAR payout failed");
            }
        } else {
            if (principalOut > 0) {
                IERC20(token).safeTransfer(to, principalOut);
            }
            if (yieldOut > 0) {
                IERC20(token).safeTransferFrom(treasury, to, yieldOut);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Views (for the UI)
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Live yield accrued so far for a position (settled + pending).
    function pendingYield(address user, uint256 strategyId, address token) public view returns (uint256) {
        Position memory pos = _positions[user][strategyId][token];
        uint256 total = pos.accrued;
        if (pos.principal > 0 && pos.lastUpdate > 0) {
            total += _linearYield(pos.principal, strategies[strategyId].apyBps, block.timestamp - pos.lastUpdate);
        }
        return total;
    }

    /// @notice Current principal + live yield for a position.
    function positionValue(address user, uint256 strategyId, address token) external view returns (uint256) {
        return _positions[user][strategyId][token].principal + pendingYield(user, strategyId, token);
    }

    function getPosition(address user, uint256 strategyId, address token)
        external
        view
        returns (Position memory)
    {
        return _positions[user][strategyId][token];
    }

    /// @notice One-call read of all of `user`'s positions for the UI table.
    function getUserPositions(address user) external view returns (PositionView[] memory views) {
        PosKey[] memory keys = _userPositions[user];
        views = new PositionView[](keys.length);
        for (uint256 i = 0; i < keys.length; i++) {
            uint256 sid = keys[i].strategyId;
            address tok = keys[i].token;
            Position memory pos = _positions[user][sid][tok];
            Strategy memory s = strategies[sid];
            views[i] = PositionView({
                strategyId: sid,
                name: s.name,
                token: tok,
                apyBps: s.apyBps,
                principal: pos.principal,
                pendingYield: pendingYield(user, sid, tok),
                active: s.active
            });
        }
    }

    function getStrategyTokens(uint256 strategyId) external view returns (address[] memory) {
        return _strategyTokens[strategyId];
    }

    /// @notice All strategies, for the Yield Hub discovery view.
    function getStrategies()
        external
        view
        returns (uint256[] memory ids, string[] memory names, uint256[] memory apys, bool[] memory actives)
    {
        uint256 n = strategyCount;
        ids = new uint256[](n);
        names = new string[](n);
        apys = new uint256[](n);
        actives = new bool[](n);
        for (uint256 i = 0; i < n; i++) {
            ids[i] = i;
            names[i] = strategies[i].name;
            apys[i] = strategies[i].apyBps;
            actives[i] = strategies[i].active;
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Native HBAR reserve
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Total HBAR held by the vault (principal custody + yield reserve).
    function hbarBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Top up the HBAR reserve used to pay native-HBAR yield.
    function fundHbarReserve() external payable {}

    /// @notice Accept plain HBAR transfers into the reserve.
    receive() external payable {}
}
