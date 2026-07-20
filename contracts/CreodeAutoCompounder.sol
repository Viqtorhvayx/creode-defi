// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// Hedera Schedule Service (HSS) system contract — HIP-1215 generalized
/// scheduled contract calls. Callable at the reserved address 0x16b.
interface IHederaScheduleService {
    function scheduleCall(
        address to,
        uint256 expirySecond,
        uint256 gasLimit,
        uint64 value,
        bytes memory callData
    ) external returns (int64 responseCode, address scheduleAddress);

    function hasScheduleCapacity(uint256 expirySecond, uint256 gasLimit) external returns (bool);
}

interface IYieldVault {
    function compound(address user, uint256 id) external;
}

/**
 * @title CreodeAutoCompounder
 * @notice Native, hands-off auto-compounding for the Creode Yield Hub using
 *         Hedera HIP-1215 scheduled contract calls. A user enrolls a position;
 *         the contract schedules {run} on itself through the Hedera Schedule
 *         Service (0x16b), and each run folds the position's accrued yield into
 *         principal via the yield vault and then re-schedules the next run — a
 *         self-perpetuating loop with no off-chain keeper or bot.
 *
 *         The contract is the payer for its scheduled calls, so it must hold a
 *         small HBAR balance for gas; top it up via {fund}.
 */
contract CreodeAutoCompounder is Ownable, ReentrancyGuard {
    address constant HSS = address(0x16b);
    int64 constant SUCCESS = 22;

    IYieldVault public vault;
    uint256 public gasLimit = 2_000_000;    // gas budget for each scheduled run (compound + re-schedule)
    uint256 public minInterval = 300;       // floor between runs (seconds)

    struct Enrollment {
        address user;
        uint256 strategyId;
        uint64 interval;   // seconds between compounds
        uint64 nextRun;    // earliest timestamp the next run may execute
        bool active;
    }

    Enrollment[] public enrollments;
    /// user => strategyId => enrollmentId+1 (0 = none) so each position enrolls once.
    mapping(address => mapping(uint256 => uint256)) public enrollmentOf;

    event Enrolled(uint256 indexed id, address indexed user, uint256 indexed strategyId, uint64 interval);
    event Cancelled(uint256 indexed id);
    event Ran(uint256 indexed id, bool compounded, uint64 nextRun);
    event Scheduled(uint256 indexed id, int64 code, address schedule, uint256 expiry);

    constructor(address yieldVault) Ownable(msg.sender) {
        vault = IYieldVault(yieldVault);
    }

    // ── User actions ──────────────────────────────────────────────────────

    /// @notice Opt a position into auto-compounding and schedule the first run.
    function enroll(uint256 strategyId, uint64 interval) external nonReentrant returns (uint256 id) {
        require(interval >= minInterval, "interval too short");
        require(enrollmentOf[msg.sender][strategyId] == 0, "already enrolled");

        id = enrollments.length;
        uint64 next = uint64(block.timestamp + interval);
        enrollments.push(Enrollment({ user: msg.sender, strategyId: strategyId, interval: interval, nextRun: next, active: true }));
        enrollmentOf[msg.sender][strategyId] = id + 1;
        emit Enrolled(id, msg.sender, strategyId, interval);

        _schedule(id, next);
    }

    /// @notice Stop auto-compounding a position (owner or the enrolled user).
    function cancel(uint256 id) external {
        Enrollment storage e = enrollments[id];
        require(msg.sender == e.user || msg.sender == owner(), "not allowed");
        e.active = false;
        enrollmentOf[e.user][e.strategyId] = 0;
        emit Cancelled(id);
    }

    // ── Scheduled callback (invoked by HSS at the scheduled second) ──────────

    /// @notice Compound the enrolled position and schedule the next run. The
    ///         nextRun gate bounds scheduling frequency, so a stray manual call
    ///         cannot spam schedules or drain gas.
    function run(uint256 id) external nonReentrant {
        Enrollment storage e = enrollments[id];
        if (!e.active) return;
        require(block.timestamp >= e.nextRun, "not due");

        uint64 next = uint64(block.timestamp + e.interval);
        e.nextRun = next;

        bool ok = true;
        try vault.compound(e.user, e.strategyId) {} catch { ok = false; }
        emit Ran(id, ok, next);

        _schedule(id, next);
    }

    // ── Scheduling ──────────────────────────────────────────────────────────

    function _schedule(uint256 id, uint256 expiry) internal {
        bytes memory cd = abi.encodeWithSelector(this.run.selector, id);
        (int64 code, address sched) = IHederaScheduleService(HSS).scheduleCall(address(this), expiry, gasLimit, 0, cd);
        emit Scheduled(id, code, sched, expiry);
    }

    /// @notice Best-effort capacity check for the next slot (non-reverting view helper).
    function hasCapacity(uint256 delaySeconds) external returns (bool) {
        return IHederaScheduleService(HSS).hasScheduleCapacity(block.timestamp + delaySeconds, gasLimit);
    }

    // ── Views ─────────────────────────────────────────────────────────────

    function enrollmentCount() external view returns (uint256) { return enrollments.length; }

    function isEnrolled(address user, uint256 strategyId) external view returns (bool) {
        return enrollmentOf[user][strategyId] != 0;
    }

    function getEnrollment(address user, uint256 strategyId) external view returns (Enrollment memory e, uint256 id) {
        uint256 slot = enrollmentOf[user][strategyId];
        if (slot == 0) return (e, type(uint256).max);
        id = slot - 1;
        e = enrollments[id];
    }

    // ── Admin ─────────────────────────────────────────────────────────────

    function fund() external payable {}
    receive() external payable {}

    function setVault(address v) external onlyOwner { vault = IYieldVault(v); }
    function setGasLimit(uint256 g) external onlyOwner { gasLimit = g; }
    function setMinInterval(uint256 s) external onlyOwner { minInterval = s; }

    function rescueHbar(address to, uint256 amount) external onlyOwner {
        (bool ok, ) = payable(to).call{ value: amount }("");
        require(ok, "rescue failed");
    }
}
