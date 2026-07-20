// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// Hedera Schedule Service (HSS) — HIP-1215 generalized scheduled contract
/// calls, callable at the reserved system address 0x16b.
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
 * @title CreodeCompoundScheduler
 * @notice Protocol-level, hands-off auto-compounding for the Creode Yield Hub
 *         via Hedera HIP-1215 scheduled contract calls.
 *
 *         Users {enroll} a position for free — it just adds them to a list, no
 *         scheduling cost. The protocol treasury schedules a batch of on-chain
 *         {tick}s through the Hedera Schedule Service (0x16b); each tick fires
 *         autonomously at its second and compounds a slice of the enrolled
 *         positions (round-robin, bounded per tick to stay within gas). The
 *         cost of scheduling is borne once by the treasury and amortized across
 *         every user, instead of each user paying to schedule their own calls.
 *
 *         The contract is the payer for its scheduled ticks, so it holds an
 *         HBAR balance for gas; top it up with {fund}. When the scheduled batch
 *         runs low the treasury calls {scheduleTicks} again to extend it.
 */
contract CreodeCompoundScheduler is Ownable, ReentrancyGuard {
    address constant HSS = address(0x16b);
    int64 constant SUCCESS = 22;

    IYieldVault public vault;
    uint256 public tickGasLimit = 3_000_000; // gas budget per scheduled tick
    uint256 public maxPerTick = 20;          // positions compounded per tick
    uint256 public cursor;                    // round-robin position pointer
    uint256 public tickCount;                 // total ticks executed
    uint64 public scheduledUntil;             // timestamp the batch reaches
    uint64 public interval;                   // seconds between auto ticks
    bool public autoOn;                       // self-perpetuating loop enabled
    int64 public lastRescheduleCode;          // HSS code from the last self-reschedule

    struct Sub { address user; uint256 strategyId; bool active; }
    Sub[] public subs;
    /// user => strategyId => index+1 (0 = not enrolled)
    mapping(address => mapping(uint256 => uint256)) public subOf;

    event Enrolled(address indexed user, uint256 indexed strategyId, uint256 id);
    event Unenrolled(address indexed user, uint256 indexed strategyId);
    event Ticked(uint256 indexed tickCount, uint256 processed);
    event TicksScheduled(uint256 count, uint64 until);

    constructor(address yieldVault) Ownable(msg.sender) {
        vault = IYieldVault(yieldVault);
    }

    // ── User opt-in (cheap — no scheduling) ─────────────────────────────────

    function enroll(uint256 strategyId) external {
        require(subOf[msg.sender][strategyId] == 0, "already enrolled");
        subs.push(Sub({ user: msg.sender, strategyId: strategyId, active: true }));
        subOf[msg.sender][strategyId] = subs.length; // index + 1
        emit Enrolled(msg.sender, strategyId, subs.length - 1);
    }

    function unenroll(uint256 strategyId) external {
        uint256 slot = subOf[msg.sender][strategyId];
        require(slot != 0, "not enrolled");
        subs[slot - 1].active = false;
        subOf[msg.sender][strategyId] = 0;
        emit Unenrolled(msg.sender, strategyId);
    }

    // ── Scheduled callback (invoked autonomously by HSS at each tick second) ──

    /// @notice Compound a bounded, round-robin slice of the enrolled positions.
    ///         Permissionless and idempotent; a no-op per position that is
    ///         inactive or has nothing accrued. `nonce` only makes each
    ///         scheduled tick content-unique so the HSS does not dedup them.
    function tick(uint256 nonce) external nonReentrant {
        nonce;
        uint256 n = subs.length;
        tickCount++;
        if (n == 0) { emit Ticked(tickCount, 0); return; }

        uint256 steps = maxPerTick < n ? maxPerTick : n;
        uint256 i = cursor;
        uint256 processed;
        for (uint256 k = 0; k < steps; k++) {
            Sub storage s = subs[i];
            if (s.active) {
                try vault.compound(s.user, s.strategyId) {} catch {}
                processed++;
            }
            i = (i + 1) % n;
        }
        cursor = i;
        emit Ticked(tickCount, processed);

        // Self-perpetuate: schedule the next tick (a single scheduleCall, within
        // the one-per-transaction limit). Best-effort so a scheduling hiccup
        // never blocks the compounding that already happened.
        if (autoOn && interval > 0) {
            uint64 next = uint64(block.timestamp) + interval;
            bytes memory cd = abi.encodeWithSelector(this.tick.selector, uint256(next));
            try IHederaScheduleService(HSS).scheduleCall(address(this), next, tickGasLimit, 0, cd) returns (int64 code, address) {
                lastRescheduleCode = code;
                if (code == SUCCESS) scheduledUntil = next;
            } catch {
                lastRescheduleCode = -1;
            }
        }
    }

    // ── Treasury: schedule the on-chain ticks ────────────────────────────────

    /// @notice Schedule `count` ticks, one per `interval` seconds, each a
    ///         top-level HIP-1215 scheduled call. Extends the existing batch.
    function scheduleTicks(uint256 count, uint64 interval) external onlyOwner returns (uint64 until) {
        require(count > 0 && count <= 48, "bad count");
        require(interval >= 60, "interval too short");
        uint64 t = scheduledUntil > block.timestamp ? scheduledUntil : uint64(block.timestamp);
        for (uint256 j = 0; j < count; j++) {
            t += interval;
            bytes memory cd = abi.encodeWithSelector(this.tick.selector, uint256(t));
            (int64 code, ) = IHederaScheduleService(HSS).scheduleCall(address(this), t, tickGasLimit, 0, cd);
            require(code == SUCCESS, "schedule failed");
        }
        scheduledUntil = t;
        until = t;
        emit TicksScheduled(count, t);
    }

    /// @notice Start the self-perpetuating loop: sets the interval and schedules
    ///         the first tick. Each tick then schedules the next on its own.
    function startAuto(uint64 _interval) external onlyOwner returns (int64 code, address sched) {
        require(_interval >= 60, "interval too short");
        interval = _interval;
        autoOn = true;
        uint64 t = uint64(block.timestamp) + _interval;
        bytes memory cd = abi.encodeWithSelector(this.tick.selector, uint256(t));
        (code, sched) = IHederaScheduleService(HSS).scheduleCall(address(this), t, tickGasLimit, 0, cd);
        require(code == SUCCESS, "schedule failed");
        scheduledUntil = t;
        emit TicksScheduled(1, t);
    }

    /// @notice Stop the loop. Any already-scheduled tick still fires but won't re-arm.
    function stopAuto() external onlyOwner { autoOn = false; }

    function hasCapacity(uint256 delaySeconds) external returns (bool) {
        return IHederaScheduleService(HSS).hasScheduleCapacity(block.timestamp + delaySeconds, tickGasLimit);
    }

    // ── Views ─────────────────────────────────────────────────────────────

    function subsCount() external view returns (uint256) { return subs.length; }
    function isEnrolled(address user, uint256 strategyId) external view returns (bool) {
        return subOf[user][strategyId] != 0;
    }
    function activeCount() external view returns (uint256 c) {
        for (uint256 i = 0; i < subs.length; i++) if (subs[i].active) c++;
    }

    // ── Admin ─────────────────────────────────────────────────────────────

    function fund() external payable {}
    receive() external payable {}

    function setVault(address v) external onlyOwner { vault = IYieldVault(v); }
    function setTickGasLimit(uint256 g) external onlyOwner { tickGasLimit = g; }
    function setMaxPerTick(uint256 m) external onlyOwner { require(m > 0, "zero"); maxPerTick = m; }
}
