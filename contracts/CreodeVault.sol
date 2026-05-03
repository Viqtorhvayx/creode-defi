// SPDX-License-Identifier: MIT
// Creator: Viqtorhvayx
// Project: CREODE Vault (Native HBAR)

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CreodeVault
 * @notice Handles native HBAR deposits and withdrawals for the CREODE project.
 * @dev Optimized for Hedera Smart Contract Service.
 * Created by Viqtorhvayx
 */
contract CreodeVault is ReentrancyGuard {
    // Official Treasury address (Hedera Account 0.0.8665514)
    address public constant TREASURY = 0x2d553c56de9153dc98d853f8ec15850b5afd004c;
    
    // Track user balances within the vault
    mapping(address => uint256) public vaultBalances;

    // Events for frontend synchronization
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    /**
     * @notice Deposit native HBAR into the contract.
     * @dev The HBAR remains in the contract's address.
     */
    function depositHBAR() external payable nonReentrant {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        
        vaultBalances[msg.sender] += msg.value;
        
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @notice Withdraw saved HBAR back to the user's wallet.
     * @param _amount The amount to withdraw (in tinybars/wei equivalent).
     */
    function withdrawHBAR(uint256 _amount) external nonReentrant {
        require(vaultBalances[msg.sender] >= _amount, "Insufficient saved HBAR");
        
        // Effects: Update balance before transfer to prevent reentrancy
        vaultBalances[msg.sender] -= _amount;
        
        // Interaction: Transfer native HBAR
        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "HBAR Transfer failed");
        
        emit Withdrawn(msg.sender, _amount);
    }

    /**
     * @dev Fallback to receive HBAR directly and trigger deposit logic.
     */
    receive() external payable {
        depositHBAR();
    }
}
