// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// Minimal HIP-1215 probe: does hashio let a contract schedule a call to
/// itself via the Hedera Schedule Service (HSS) system contract at 0x16b?
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

contract ScheduleSpike {
    address constant HSS = address(0x16b);

    uint256 public counter;          // bumped by the scheduled call
    uint256 public lastScheduledFor; // expiry we asked for
    int64 public lastResponseCode;   // 22 == SUCCESS
    address public lastSchedule;     // address of the created schedule

    event Bumped(uint256 counter, uint256 at);
    event Scheduled(int64 code, address schedule, uint256 expiry);

    /// Schedule bump() to run `delaySeconds` from now.
    function kick(uint256 delaySeconds, uint256 gasLimit) external returns (int64 code, address sched) {
        uint256 expiry = block.timestamp + delaySeconds;
        bytes memory cd = abi.encodeWithSelector(this.bump.selector);
        (code, sched) = IHederaScheduleService(HSS).scheduleCall(address(this), expiry, gasLimit, 0, cd);
        lastResponseCode = code;
        lastSchedule = sched;
        lastScheduledFor = expiry;
        emit Scheduled(code, sched, expiry);
    }

    /// Read-only capacity check.
    function capacity(uint256 delaySeconds, uint256 gasLimit) external returns (bool) {
        return IHederaScheduleService(HSS).hasScheduleCapacity(block.timestamp + delaySeconds, gasLimit);
    }

    /// The scheduled target.
    function bump() external {
        counter += 1;
        emit Bumped(counter, block.timestamp);
    }

    receive() external payable {}
}
