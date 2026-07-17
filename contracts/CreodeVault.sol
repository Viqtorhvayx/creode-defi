// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CreodeVault
 * @author Viqtorhvayx
 * @notice Time-locked, multi-token savings vault for the Hedera network.
 *
 * Architecture:
 *  - All supported assets are handled through the ERC20 / HTS token interface
 *    (SafeERC20). On Hedera, HTS tokens expose the ERC20 ABI via the token's
 *    EVM address, so USDT/USDC/SAUCE/... and WHBAR are all driven uniformly.
 *    NOTE: "HBAR" in the tier table below refers to WHBAR (the HTS-wrapped
 *    form). Native HBAR cannot be `approve`d or pulled via `transferFrom`,
 *    which this design (yield funded from Treasury allowance) requires.
 *
 *  - Principal is custodied by the vault. Yield is NOT minted or held here:
 *    it is pulled from the Treasury via HTS allowance (`safeTransferFrom`)
 *    at exit time. The Treasury MUST approve this contract as a spender for
 *    every yield-bearing token, and hold enough balance to cover payouts.
 *
 *  - Percentages use Basis Points (BPS): 10_000 = 100%.
 */
contract CreodeVault is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────────────

    /// @dev 100% in basis points.
    uint256 public constant BPS_DENOMINATOR = 10_000;

    /// @dev Hard cap on the mutable global fee (1.00%) to prevent rug pulls.
    uint256 public constant MAX_GLOBAL_FEE_BPS = 100;

    /// @dev Maximum early-exit penalty (2.00%), applied to principal only.
    uint256 public constant MAX_EARLY_PENALTY_BPS = 200;

    /// @dev Seconds in a 365-day year, used to pro-rate APY into accrued yield.
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    /// @dev Tier boundaries (in days) used for APY interpolation.
    uint256 public constant TIER_A_DAYS = 7;
    uint256 public constant TIER_B_DAYS = 30;
    uint256 public constant TIER_C_DAYS = 60;

    // ─────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────

    struct TokenConfig {
        bool supported;
        uint256 minDeposit; // in the token's smallest unit (accounts for decimals)
        uint256 apy7DBps; // APY in BPS for a 7-day lock
        uint256 apy30DBps; // APY in BPS for a 30-day lock
        uint256 apy60DBps; // APY in BPS for a 60-day lock
    }

    struct Deposit {
        address user;
        address token;
        uint256 principal; // amount locked after fee (99.75% of gross by default)
        uint256 startTimestamp;
        uint256 maturityTimestamp;
        uint256 apyBps; // snapshotted at deposit time
        bool withdrawn;
    }

    // ─────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Protocol treasury: receives fees + penalties and funds yield.
    address public treasury;

    /// @notice Mutable global entry fee in BPS (default 25 = 0.25%).
    uint256 public globalFeeBPS = 25;

    /// @notice Per-token configuration (APY tiers + minimum deposit).
    mapping(address => TokenConfig) public tokenConfigs;

    /// @notice Monotonic deposit id counter.
    uint256 public nextDepositId;

    /// @notice depositId => Deposit record.
    mapping(uint256 => Deposit) public deposits;

    /// @notice user => list of their deposit ids (for enumeration by the UI).
    mapping(address => uint256[]) private _userDepositIds;

    // ─────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────

    event TreasuryUpdated(address indexed treasury);
    event GlobalFeeUpdated(uint256 feeBps);
    event TokenConfigured(
        address indexed token,
        uint256 minDeposit,
        uint256 apy7DBps,
        uint256 apy30DBps,
        uint256 apy60DBps
    );
    event TokenSupportUpdated(address indexed token, bool supported);
    event MinDepositUpdated(address indexed token, uint256 minDeposit);
    event ApyTiersUpdated(address indexed token, uint256 apy7DBps, uint256 apy30DBps, uint256 apy60DBps);

    event Deposited(
        uint256 indexed depositId,
        address indexed user,
        address indexed token,
        uint256 principal,
        uint256 fee,
        uint256 apyBps,
        uint256 maturityTimestamp
    );
    event Withdrawn(
        uint256 indexed depositId,
        address indexed user,
        address indexed token,
        uint256 principal,
        uint256 yieldPaid
    );
    event UnlockedEarly(
        uint256 indexed depositId,
        address indexed user,
        address indexed token,
        uint256 principalReturned,
        uint256 penalty,
        uint256 yieldPaid
    );

    // ─────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────

    /**
     * @param _admin  Multi-sig that receives DEFAULT_ADMIN_ROLE.
     * @param _treasury Protocol treasury address.
     */
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

    /// @notice Update the global entry fee. Hard-capped at MAX_GLOBAL_FEE_BPS.
    function setGlobalFee(uint256 _feeBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_feeBps <= MAX_GLOBAL_FEE_BPS, "Fee exceeds hard cap");
        globalFeeBPS = _feeBps;
        emit GlobalFeeUpdated(_feeBps);
    }

    /**
     * @notice Configure (or re-configure) a supported token in one call.
     *
     * Recommended launch values (raw units already scaled for decimals):
     *  Stablecoins (USDT/USDC, 6 dp):   min 10        | 400 / 650 / 900
     *  Blue-Chips (WHBAR 8dp, W/BTC/ETH 8dp):
     *      WHBAR  min 100    | 350 / 550 / 800
     *      WETH   min 0.003  | 350 / 550 / 800
     *      WBTC   min 0.00015| 350 / 550 / 800
     *  Volatility (SAUCE/PACK/BONZO/JAM, 6 dp):
     *      SAUCE  min 200    | 800 / 1400 / 2200
     *      PACK   min 100000 | 800 / 1400 / 2200
     *      BONZO  min 200000 | 800 / 1400 / 2200
     *      JAM    min 2000   | 800 / 1400 / 2200
     */
    function configureToken(
        address token,
        uint256 minDeposit,
        uint256 apy7DBps,
        uint256 apy30DBps,
        uint256 apy60DBps
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(token != address(0), "Token is zero address");
        tokenConfigs[token] = TokenConfig({
            supported: true,
            minDeposit: minDeposit,
            apy7DBps: apy7DBps,
            apy30DBps: apy30DBps,
            apy60DBps: apy60DBps
        });
        emit TokenConfigured(token, minDeposit, apy7DBps, apy30DBps, apy60DBps);
    }

    function setTokenSupported(address token, bool supported) external onlyRole(DEFAULT_ADMIN_ROLE) {
        tokenConfigs[token].supported = supported;
        emit TokenSupportUpdated(token, supported);
    }

    function setMinDeposit(address token, uint256 minDeposit) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(tokenConfigs[token].supported, "Token not supported");
        tokenConfigs[token].minDeposit = minDeposit;
        emit MinDepositUpdated(token, minDeposit);
    }

    function setApyTiers(
        address token,
        uint256 apy7DBps,
        uint256 apy30DBps,
        uint256 apy60DBps
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(tokenConfigs[token].supported, "Token not supported");
        tokenConfigs[token].apy7DBps = apy7DBps;
        tokenConfigs[token].apy30DBps = apy30DBps;
        tokenConfigs[token].apy60DBps = apy60DBps;
        emit ApyTiersUpdated(token, apy7DBps, apy30DBps, apy60DBps);
    }

    // ─────────────────────────────────────────────────────────────────────
    // APY math (linear interpolation)
    // ─────────────────────────────────────────────────────────────────────

    /**
     * @notice Resolve the APY (in BPS) for a given token and lock duration.
     *
     * Interpolation between adjacent tiers:
     *   APY = A + (B - A) * (days - daysA) / (daysB - daysA)
     *
     * Ranges:
     *   duration <= 7      -> apy7DBps
     *   7  < duration <= 30 -> interpolate(7D, 30D)
     *   30 < duration <= 60 -> interpolate(30D, 60D)
     *   duration > 60      -> clamped to apy60DBps (no unbounded extrapolation)
     */
    function quoteAPY(address token, uint256 durationDays) public view returns (uint256) {
        TokenConfig memory cfg = tokenConfigs[token];
        require(cfg.supported, "Token not supported");
        require(durationDays > 0, "Duration must be > 0");

        if (durationDays <= TIER_A_DAYS) {
            return cfg.apy7DBps;
        } else if (durationDays <= TIER_B_DAYS) {
            return _interpolate(cfg.apy7DBps, cfg.apy30DBps, durationDays - TIER_A_DAYS, TIER_B_DAYS - TIER_A_DAYS);
        } else if (durationDays <= TIER_C_DAYS) {
            return _interpolate(cfg.apy30DBps, cfg.apy60DBps, durationDays - TIER_B_DAYS, TIER_C_DAYS - TIER_B_DAYS);
        } else {
            return cfg.apy60DBps;
        }
    }

    function _interpolate(
        uint256 apyA,
        uint256 apyB,
        uint256 daysIntoRange,
        uint256 rangeSpanDays
    ) private pure returns (uint256) {
        if (apyB >= apyA) {
            return apyA + ((apyB - apyA) * daysIntoRange) / rangeSpanDays;
        }
        // Support a decreasing tier configuration without underflow.
        return apyA - ((apyA - apyB) * daysIntoRange) / rangeSpanDays;
    }

    /// @dev Pro-rate a snapshotted APY into an accrued yield amount.
    function _accruedYield(uint256 principal, uint256 apyBps, uint256 elapsedSeconds)
        private
        pure
        returns (uint256)
    {
        return (principal * apyBps * elapsedSeconds) / (BPS_DENOMINATOR * SECONDS_PER_YEAR);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Function 1: deposit
    // ─────────────────────────────────────────────────────────────────────

    /**
     * @notice Lock `_amount` of `_token` for `_duration` days.
     * @dev Requires prior token approval of `_amount` to this contract.
     *      Charges globalFeeBPS on the gross amount (routed to Treasury),
     *      locks the remainder as principal, and snapshots the APY.
     * @return depositId The id of the newly created deposit.
     */
    function depositToVault(address _token, uint256 _amount, uint256 _duration)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 depositId)
    {
        TokenConfig memory cfg = tokenConfigs[_token];
        require(cfg.supported, "Token not supported");
        require(_duration > 0, "Duration must be > 0");
        require(_amount >= cfg.minDeposit, "Below minimum deposit");

        // Pull the gross amount in first (requires allowance).
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        // Route the entry fee straight to the Treasury; lock the remainder.
        uint256 fee = (_amount * globalFeeBPS) / BPS_DENOMINATOR;
        uint256 principal = _amount - fee;
        if (fee > 0) {
            IERC20(_token).safeTransfer(treasury, fee);
        }

        uint256 apyBps = quoteAPY(_token, _duration);
        uint256 maturity = block.timestamp + (_duration * 1 days);

        depositId = nextDepositId++;
        deposits[depositId] = Deposit({
            user: msg.sender,
            token: _token,
            principal: principal,
            startTimestamp: block.timestamp,
            maturityTimestamp: maturity,
            apyBps: apyBps,
            withdrawn: false
        });
        _userDepositIds[msg.sender].push(depositId);

        emit Deposited(depositId, msg.sender, _token, principal, fee, apyBps, maturity);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Function 2: withdraw (matured exit)
    // ─────────────────────────────────────────────────────────────────────

    /**
     * @notice Withdraw a matured deposit: full principal back + full-term yield.
     * @dev Yield is pulled from the Treasury via HTS allowance.
     */
    function withdraw(uint256 _depositId) external nonReentrant {
        Deposit storage dep = deposits[_depositId];
        require(dep.user == msg.sender, "Not deposit owner");
        require(!dep.withdrawn, "Already withdrawn");
        require(block.timestamp >= dep.maturityTimestamp, "Not yet matured");

        // Yield accrues over the full locked term for a matured exit.
        uint256 lockDuration = dep.maturityTimestamp - dep.startTimestamp;
        uint256 yieldAmount = _accruedYield(dep.principal, dep.apyBps, lockDuration);

        uint256 principal = dep.principal;
        address token = dep.token;

        // Effects before interactions.
        dep.withdrawn = true;

        // Return 100% of principal from the vault's own custody.
        IERC20(token).safeTransfer(msg.sender, principal);

        // Pull the yield from the Treasury allowance and forward it to the user.
        if (yieldAmount > 0) {
            IERC20(token).safeTransferFrom(treasury, msg.sender, yieldAmount);
        }

        emit Withdrawn(_depositId, msg.sender, token, principal, yieldAmount);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Function 3: unlock (early exit)
    // ─────────────────────────────────────────────────────────────────────

    /**
     * @notice Exit a deposit before maturity.
     * @dev User keeps yield accrued so far (pulled from Treasury). A
     *      time-decaying penalty (max 2%) is taken from principal and sent
     *      to the Treasury; the remaining principal + yield goes to the user.
     *
     *      penaltyBps = MAX_EARLY_PENALTY_BPS * remainingTime / totalDuration
     */
    function unlock(uint256 _depositId) external nonReentrant {
        Deposit storage dep = deposits[_depositId];
        require(dep.user == msg.sender, "Not deposit owner");
        require(!dep.withdrawn, "Already withdrawn");
        require(block.timestamp < dep.maturityTimestamp, "Already matured; use withdraw");

        uint256 elapsed = block.timestamp - dep.startTimestamp;
        uint256 yieldAmount = _accruedYield(dep.principal, dep.apyBps, elapsed);

        uint256 totalDuration = dep.maturityTimestamp - dep.startTimestamp;
        uint256 remainingTime = dep.maturityTimestamp - block.timestamp;

        // Penalty on principal, decaying to 0 as maturity approaches.
        uint256 penalty =
            (dep.principal * MAX_EARLY_PENALTY_BPS * remainingTime) / (totalDuration * BPS_DENOMINATOR);
        uint256 principalReturned = dep.principal - penalty;

        address token = dep.token;

        // Effects before interactions.
        dep.withdrawn = true;

        // Penalty stays with the protocol Treasury.
        if (penalty > 0) {
            IERC20(token).safeTransfer(treasury, penalty);
        }
        // Remaining principal back to the user (from vault custody).
        IERC20(token).safeTransfer(msg.sender, principalReturned);
        // Accrued yield pulled from the Treasury allowance.
        if (yieldAmount > 0) {
            IERC20(token).safeTransferFrom(treasury, msg.sender, yieldAmount);
        }

        emit UnlockedEarly(_depositId, msg.sender, token, principalReturned, penalty, yieldAmount);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Views (for the UI)
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Live yield accrued so far for a deposit (capped at the full term).
    function previewYield(uint256 _depositId) external view returns (uint256) {
        Deposit memory dep = deposits[_depositId];
        if (dep.withdrawn || dep.principal == 0) return 0;
        uint256 elapsed = block.timestamp - dep.startTimestamp;
        uint256 lockDuration = dep.maturityTimestamp - dep.startTimestamp;
        if (elapsed > lockDuration) elapsed = lockDuration;
        return _accruedYield(dep.principal, dep.apyBps, elapsed);
    }

    /// @notice All deposit ids belonging to `user`.
    function getUserDepositIds(address user) external view returns (uint256[] memory) {
        return _userDepositIds[user];
    }

    /// @notice Convenience one-call read: ids + full records for `user`.
    function getUserDeposits(address user)
        external
        view
        returns (uint256[] memory ids, Deposit[] memory records)
    {
        ids = _userDepositIds[user];
        records = new Deposit[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            records[i] = deposits[ids[i]];
        }
    }

    /// @notice Number of deposits ever created by `user` (including withdrawn).
    function userDepositCount(address user) external view returns (uint256) {
        return _userDepositIds[user].length;
    }
}
