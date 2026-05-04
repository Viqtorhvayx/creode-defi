// SPDX-License-Identifier: MIT
// Creator: Viqtorhvayx
// Project: CREODE Vault (Native HBAR Time-Locked Savings)

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CreodeVault
 * @notice Flawless time-locked savings vault for native HBAR.
 * @dev Implements a strict 5% early withdrawal penalty directed to the protocol treasury.
 * Created by Viqtorhvayx
 */
contract CreodeVault is ReentrancyGuard {
    // Official Treasury address (Hedera Account 0.0.8665514)
    address public constant TREASURY = 0x2d553C56De9153dc98D853f8EC15850b5aFd004c;
    
    // User data tracking
    mapping(address => uint256) public vaultBalances;
    mapping(address => uint256) public unlockTimes;

    // Events for frontend synchronization
    event Deposited(address indexed user, uint256 amount, uint256 unlockTime);
    event Withdrawn(address indexed user, uint256 amount, uint256 feePaid);

    /**
     * @notice Deposit native HBAR and set a maturity duration.
     * @param _durationInDays Number of days until maturity.
     */
    function depositHBAR(uint256 _durationInDays) external payable nonReentrant {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        
        vaultBalances[msg.sender] += msg.value;
        unlockTimes[msg.sender] = block.timestamp + (_durationInDays * 1 days);
        
        emit Deposited(msg.sender, msg.value, unlockTimes[msg.sender]);
    }

    /**
     * @notice Withdraw HBAR. If early, a 5% penalty is assessed.
     * @param _amount The amount to withdraw (tinybars).
     */
    function withdrawHBAR(uint256 _amount) external nonReentrant {
        require(vaultBalances[msg.sender] >= _amount, "Insufficient saved HBAR");
        
        uint256 penalty = 0;
        uint256 userReturn = _amount;

        // Apply 5% penalty if maturity date has not been reached
        if (block.timestamp < unlockTimes[msg.sender]) {
            penalty = (_amount * 5) / 100;
            userReturn = _amount - penalty;
        }

        // Effects: Update state before external transfers
        vaultBalances[msg.sender] -= _amount;
        
        // Interaction: Send return to user
        (bool successUser, ) = payable(msg.sender).call{value: userReturn}("");
        require(successUser, "HBAR Return Failed");

        // Interaction: Send penalty to Treasury (if applicable)
        if (penalty > 0) {
            (bool successTreasury, ) = payable(TREASURY).call{value: penalty}("");
            require(successTreasury, "Penalty Transfer Failed");
        }
        
        emit Withdrawn(msg.sender, _amount, penalty);
    }

    /**
     * @dev Fallback to receive HBAR. Defaults to 30-day maturity.
     */
    receive() external payable {
        vaultBalances[msg.sender] += msg.value;
        unlockTimes[msg.sender] = block.timestamp + (30 days);
    }
}
