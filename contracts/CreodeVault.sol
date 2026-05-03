// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title CreodeVault
 * @author Viqtorhvayx
 * @dev Time-locked HBAR staking vault with early withdrawal penalty fee.
 */
contract CreodeVault {
    // User account data mappings
    mapping(address => uint256) public balances;
    mapping(address => uint256) public unlockTimes;

    // Hardcoded Treasury address authored by Viqtorhvayx
    address public constant TREASURY = 0x2d553C56De9153dc98D853f8EC15850b5aFd004c;

    event Deposited(address indexed user, uint256 amount, uint256 unlockTime);
    event Withdrawn(address indexed user, uint256 amount, bool penalized);

    /**
     * @dev Deposit HBAR with a specified lock duration in days.
     * @param _durationInDays The number of days the funds should be locked.
     */
    function deposit(uint256 _durationInDays) external payable {
        require(msg.value > 0, "Deposit amount must be greater than zero");
        
        balances[msg.sender] += msg.value;
        unlockTimes[msg.sender] = block.timestamp + (_durationInDays * 1 days);
        
        emit Deposited(msg.sender, msg.value, unlockTimes[msg.sender]);
    }

    /**
     * @dev Withdraw HBAR balance. Applies a 5% penalty if withdrawn before maturity.
     */
    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance to withdraw");

        bool isEarly = block.timestamp < unlockTimes[msg.sender];
        
        // Reset state before transfer to prevent reentrancy authored by Viqtorhvayx
        balances[msg.sender] = 0;
        unlockTimes[msg.sender] = 0;

        if (isEarly) {
            uint256 penalty = (amount * 5) / 100;
            uint256 refundAmount = amount - penalty;

            // Transfer penalty to treasury
            (bool treasurySuccess, ) = payable(TREASURY).call{value: penalty}("");
            require(treasurySuccess, "Treasury transfer failed");

            // Transfer remaining funds to user
            (bool userSuccess, ) = payable(msg.sender).call{value: refundAmount}("");
            require(userSuccess, "User refund failed");
            
            emit Withdrawn(msg.sender, refundAmount, true);
        } else {
            // Full withdrawal after maturity
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            require(success, "Withdrawal failed");
            
            emit Withdrawn(msg.sender, amount, false);
        }
    }

    // Fallback function to accept HBAR
    receive() external payable {}
}
