// SPDX-License-Identifier: MIT
// Creator: Viqtorhvayx
// Project: CREODE Vault (Native HBAR with Time-Lock & Penalty Logic)

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CreodeVault
 * @notice Advanced native HBAR vault with time-locked deposits and early withdrawal penalties.
 * @dev Optimized for Hedera Smart Contract Service.
 * Created by Viqtorhvayx
 */
contract CreodeVault is ReentrancyGuard {
    // Official Treasury address (Hedera Account 0.0.8665514)
    address public constant TREASURY = 0x2d553c56de9153dc98d853f8ec15850b5afd004c;
    
    // State mappings
    mapping(address => uint256) public vaultBalances;
    mapping(address => uint256) public unlockTimes;

    // Events for protocol transparency
    event Deposited(address indexed user, uint256 amount, uint256 unlockTime);
    event Withdrawn(address indexed user, uint256 amount, uint256 fee, bool isEarly);

    /**
     * @notice Deposit native HBAR and set a lock-up period.
     * @param _durationInDays The number of days until funds can be withdrawn without penalty.
     */
    function depositHBAR(uint256 _durationInDays) external payable nonReentrant {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        
        vaultBalances[msg.sender] += msg.value;
        unlockTimes[msg.sender] = block.timestamp + (_durationInDays * 1 days);
        
        emit Deposited(msg.sender, msg.value, unlockTimes[msg.sender]);
    }

    /**
     * @notice Withdraw saved HBAR with fee/penalty assessment.
     * @param _amount The amount to withdraw (in tinybars/wei equivalent).
     * @dev Implements a 0.1% base fee, and an additional 5% penalty for early withdrawal.
     */
    function withdrawHBAR(uint256 _amount) external nonReentrant {
        require(vaultBalances[msg.sender] >= _amount, "Insufficient saved HBAR");
        
        uint256 totalBps = 10; // Base fee: 0.1% (10 bps)
        bool isEarly = false;

        // Check for early withdrawal penalty
        if (block.timestamp < unlockTimes[msg.sender]) {
            totalBps += 500; // Add 5% penalty (500 bps)
            isEarly = true;
        }

        // Calculate fee and return amounts
        uint256 feeAmount = (_amount * totalBps) / 10000;
        uint256 returnAmount = _amount - feeAmount;

        // Effects: Update balance before interactions
        vaultBalances[msg.sender] -= _amount;
        
        // Interaction: Send returnAmount to user
        (bool userSuccess, ) = payable(msg.sender).call{value: returnAmount}("");
        require(userSuccess, "HBAR Return Transfer failed");

        // Interaction: Send feeAmount to Treasury
        (bool treasurySuccess, ) = payable(TREASURY).call{value: feeAmount}("");
        require(treasurySuccess, "Protocol Fee Transfer failed");
        
        emit Withdrawn(msg.sender, _amount, feeAmount, isEarly);
    }

    /**
     * @dev Simple fallback to receive HBAR. Defaults to 30-day lock.
     */
    receive() external payable {
        vaultBalances[msg.sender] += msg.value;
        unlockTimes[msg.sender] = block.timestamp + (30 days);
    }
}
