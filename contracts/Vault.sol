// SPDX-License-Identifier: MIT
// Creator: [Viqtorhvayx]
// Project: CREODE Vault (Native HBAR - Zero Dependency)

pragma solidity ^0.8.0;

/**
 * @title Vault
 * @notice Secure HBAR savings with time-locks and early withdrawal penalties.
 * @dev Manual ReentrancyGuard implementation to avoid external library dependencies.
 * Created by [Viqtorhvayx]
 */
contract Vault {
    // Official Treasury address (Hedera Account 0.0.8665514)
    address public constant TREASURY = 0x2d553C56De9153dc98D853f8EC15850B5aFd004c;
    
    // State Tracking
    mapping(address => uint256) public vaultBalances;
    mapping(address => uint256) public unlockTimes;
    
    // Manual Reentrancy Guard
    bool private _locked;
    modifier nonReentrant() {
        require(!_locked, "ReentrancyGuard: reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    event Deposited(address indexed user, uint256 amount, uint256 unlockTime);
    event Withdrawn(address indexed user, uint256 amount, uint256 feePaid);

    /**
     * @notice Deposit HBAR with a custom lock duration.
     * @param _durationInDays Days until penalty-free withdrawal.
     */
    function depositHBAR(uint256 _durationInDays) external payable nonReentrant {
        require(msg.value > 0, "Amount must be > 0");
        vaultBalances[msg.sender] += msg.value;
        unlockTimes[msg.sender] = block.timestamp + (_durationInDays * 1 days);
        emit Deposited(msg.sender, msg.value, unlockTimes[msg.sender]);
    }

    /**
     * @notice Withdraw HBAR. 5% penalty applied if early.
     */
    function withdrawHBAR(uint256 _amount) external nonReentrant {
        require(vaultBalances[msg.sender] >= _amount, "Insufficient balance");
        
        uint256 fee = 0;
        uint256 userReturn = _amount;

        // Apply 5% penalty for early withdrawals
        if (block.timestamp < unlockTimes[msg.sender]) {
            fee = (_amount * 5) / 100;
            userReturn = _amount - fee;
        }

        vaultBalances[msg.sender] -= _amount;
        
        // Native HBAR Transfers
        (bool successUser, ) = payable(msg.sender).call{value: userReturn}("");
        require(successUser, "User transfer failed");

        if (fee > 0) {
            (bool successTreasury, ) = payable(TREASURY).call{value: fee}("");
            require(successTreasury, "Treasury transfer failed");
        }
        
        emit Withdrawn(msg.sender, _amount, fee);
    }

    /**
     * @dev Simple getter for vault balance.
     */
    function getBalance(address _user) external view returns (uint256) {
        return vaultBalances[_user];
    }

    /**
     * @dev Simple getter for unlock time.
     */
    function getUnlockTime(address _user) external view returns (uint256) {
        return unlockTimes[_user];
    }

    receive() external payable {
        vaultBalances[msg.sender] += msg.value;
        unlockTimes[msg.sender] = block.timestamp + (30 days);
    }
}
