// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// Hedera Schedule Service (HSS) system contract — HIP-1215 generalized
/// scheduled contract calls, callable at the reserved address 0x16b.
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
 *         Hedera HIP-1215 scheduled contract calls.
 *
 *         Enrolling a position schedules a BATCH of future compounds up front —
 *         one call per interval — through the Hedera Schedule Service (0x16b).
 *         Each scheduled call executes {run}, which folds the position's
 *         accrued yield into principal via the yield vault. When the batch runs
 *         low the user (or anyone) can {extend} it with another batch. Batching
 *         from a normal top-level transaction is used deliberately: it keeps
 *         every scheduled call independent, cheap, and free of any re-entrant
 *         scheduling, so the loop is robust with no off-chain keeper or bot.
 *
 *         The contract is the payer for its scheduled calls, so it holds a
 *         small HBAR balance for gas; top it up with {fund}.
 */
contract CreodeAutoCompounder is Ownable, ReentrancyGuard {
    address constant HSS = address(0x16b);
    int64 constant SUCCESS = 22;

    IYieldVault public vault;
    uint256 public gasLimit = 800_000;   // gas budget per scheduled compound
    uint256 public minInterval = 300;    // floor between compounds (seconds)
    uint256 public maxBatch = 24;        // max compounds scheduled per call

    struct Enrollment {
        address user;
        uint256 strategyId;
        uint64 interval;        // seconds between compounds
        uint64 scheduledUntil;  // timestamp the current batch reaches
        uint32 runs;            // scheduled runs executed so far
        bool active;
    }

    Enrollment[] public enrollments;
    /// user => strategyId => enrollmentId+1 (0 = none).
    mapping(address => mapping(uint256 => uint256)) public enrollmentOf;
    uint256 public totalRuns; // global counter — proves autonomous execution

    event Enrolled(uint256 indexed id, address indexed user, uint256 indexed strategyId, uint64 interval, uint256 count, uint64 scheduledUntil);
    event Extended(uint256 indexed id, uint256 count, uint64 scheduledUntil);
    event Cancelled(uint256 indexed id);
    event Ran(uint256 indexed id, bool compounded, uint256 totalRuns);
    event Scheduled(uint256 indexed id, int64 code, address schedule, uint256 expiry);

    constructor(address yieldVault) Ownable(msg.sender) {
        vault = IYieldVault(yieldVault);
    }

    // ── User actions ──────────────────────────────────────────────────────

    /// @notice Enroll a position and schedule `count` compounds, one per interval.
    function enroll(uint256 strategyId, uint64 interval, uint256 count) external nonReentrant returns (uint256 id) {
        require(interval >= minInterval, "interval too short");
        require(count > 0 && count <= maxBatch, "bad count");
        require(enrollmentOf[msg.sender][strategyId] == 0, "already enrolled");

        id = enrollments.length;
        enrollments.push(Enrollment({
            user: msg.sender, strategyId: strategyId, interval: interval,
            scheduledUntil: uint64(block.timestamp), runs: 0, active: true
        }));
        enrollmentOf[msg.sender][strategyId] = id + 1;

        uint64 until = _scheduleBatch(id, uint64(block.timestamp), interval, count);
        enrollments[id].scheduledUntil = until;
        emit Enrolled(id, msg.sender, strategyId, interval, count, until);
    }

    /// @notice Schedule another batch of `count` compounds for an active enrollment.
    function extend(uint256 id, uint256 count) external nonReentrant {
        require(id < enrollments.length, "bad id");
        Enrollment storage e = enrollments[id];
        require(e.active, "inactive");
        require(count > 0 && count <= maxBatch, "bad count");
        uint64 from = e.scheduledUntil > block.timestamp ? e.scheduledUntil : uint64(block.timestamp);
        uint64 until = _scheduleBatch(id, from, e.interval, count);
        e.scheduledUntil = until;
        emit Extended(id, count, until);
    }

    /// @notice Stop auto-compounding (owner or the enrolled user). Any compounds
    ///         still scheduled become no-ops via the active flag in {run}.
    function cancel(uint256 id) external {
        require(id < enrollments.length, "bad id");
        Enrollment storage e = enrollments[id];
        require(msg.sender == e.user || msg.sender == owner(), "not allowed");
        e.active = false;
        enrollmentOf[e.user][e.strategyId] = 0;
        emit Cancelled(id);
    }

    // ── Scheduled callback (invoked by HSS at each scheduled second) ─────────

    /// @notice Compound the enrolled position. Permissionless and idempotent —
    ///         a no-op if the enrollment was cancelled or the position is empty.
    ///         `nonce` is unused by the logic; it only makes each scheduled
    ///         call's calldata unique so the Hedera Schedule Service does not
    ///         dedup two compounds of the same position into one schedule.
    function run(uint256 id, uint256 nonce) external nonReentrant {
        nonce; // silence unused-parameter warning
        Enrollment storage e = enrollments[id];
        if (!e.active) return;
        bool ok = true;
        try vault.compound(e.user, e.strategyId) {} catch { ok = false; }
        e.runs += 1;
        totalRuns += 1;
        emit Ran(id, ok, totalRuns);
    }

    // ── Scheduling ──────────────────────────────────────────────────────────

    function _scheduleBatch(uint256 id, uint64 from, uint64 interval, uint256 count) internal returns (uint64 until) {
        uint64 t = from;
        for (uint256 i = 0; i < count; i++) {
            t += interval;
            // Encode the target second as the nonce so every scheduled call is
            // content-unique (the HSS dedups identical scheduled transactions).
            bytes memory cd = abi.encodeWithSelector(this.run.selector, id, uint256(t));
            (int64 code, address sched) = IHederaScheduleService(HSS).scheduleCall(address(this), t, gasLimit, 0, cd);
            require(code == SUCCESS, "schedule failed");
            emit Scheduled(id, code, sched, t);
        }
        until = t;
    }

    /// @notice Capacity check for a prospective slot.
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
    function setMaxBatch(uint256 m) external onlyOwner { maxBatch = m; }

    function rescueHbar(address to, uint256 amount) external onlyOwner {
        (bool ok, ) = payable(to).call{ value: amount }("");
        require(ok, "rescue failed");
    }
}
