// SPDX-License-Identifier: MIT
/*
 * Developer: [Viqtorhvayx]
 * Contract: Creode Vault (Zero-Dependency)
 * Description: Secure HBAR time-lock vault with early withdrawal penalties.
 *              No external libraries used to ensure flawless deployment.
 */

pragma solidity ^0.8.0;

contract Vault {
    address public owner;
    address public treasury;
    
    struct UserDeposit {
        uint256 amount;
        uint256 unlockTime;
    }
    
    mapping(address => UserDeposit) public deposits;
    bool private _locked;

    event HBARDeposited(address indexed user, uint256 amount, uint256 unlockTime);
    event HBARWithdrawn(address indexed user, uint256 amount, bool isEarly);

    // Manual ReentrancyGuard implementation
    modifier noReentrant() {
        require(!_locked, "ReentrancyGuard: reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    constructor(address _treasury) {
        require(_treasury != address(0), "Invalid treasury address");
        treasury = _treasury;
        owner = msg.sender;
    }

    /**
     * @dev Deposit HBAR for a specific duration (in days)
     */
    function depositHBAR(uint256 _durationInDays) external payable noReentrant {
        require(msg.value > 0, "Deposit amount must be greater than zero");
        
        UserDeposit storage dep = deposits[msg.sender];
        dep.amount += msg.value;
        dep.unlockTime = block.timestamp + (_durationInDays * 1 days);
        
        emit HBARDeposited(msg.sender, msg.value, dep.unlockTime);
    }

    /**
     * @dev Withdraw HBAR. Early withdrawal incurs a 5% penalty to Treasury.
     */
    function withdrawHBAR(uint256 _amount) external noReentrant {
        UserDeposit storage dep = deposits[msg.sender];
        require(dep.amount >= _amount, "Insufficient vault balance");
        
        uint256 payout;
        uint256 penalty;
        
        if (block.timestamp < dep.unlockTime) {
            // Early withdrawal penalty: 5%
            penalty = (_amount * 5) / 100;
            payout = _amount - penalty;
        } else {
            // Maturity reached: 100% payout
            payout = _amount;
        }
        
        // Update state before external calls
        dep.amount -= _amount;
        
        if (penalty > 0) {
            (bool successTreasury, ) = payable(treasury).call{value: penalty}("");
            require(successTreasury, "Transfer to Treasury failed");
        }
        
        (bool successUser, ) = payable(msg.sender).call{value: payout}("");
        require(successUser, "Transfer to user failed");
        
        emit HBARWithdrawn(msg.sender, _amount, block.timestamp < dep.unlockTime);
    }

    /**
     * @dev View functions for frontend integration
     */
    function getBalance(address _user) external view returns (uint256) {
        return deposits[_user].amount;
    }

    function getUnlockTime(address _user) external view returns (uint256) {
        return deposits[_user].unlockTime;
    }
    
    receive() external payable {}
}
