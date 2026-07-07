// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CreodeXP
 * @author Viqtorhvayx
 * @dev Manages the reputation score (XP) for the CREODE DeFi ecosystem.
 * Features a time-based decay system for active borrowers.
 */
contract CreodeXP {
    struct UserProfile {
        uint8 xp;
        uint256 lastDecayTimestamp;
        bool isLocked;
        bool isBorrowing;
    }

    mapping(address => UserProfile) public profiles;
    address public owner;
    address public vault;

    event XPUpdated(address indexed user, uint8 newXP);
    event XPDecayed(address indexed user, uint8 amount);
    event UserLocked(address indexed user);
    event UserUnlocked(address indexed user);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only Viqtorhvayx can perform this action");
        _;
    }

    modifier onlyVault() {
        require(msg.sender == vault || msg.sender == owner, "Unauthorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setVault(address _vault) external onlyOwner {
        vault = _vault;
    }

    function getXP(address user) external view returns (uint8) {
        uint8 baseXP = profiles[user].xp == 0 ? 50 : profiles[user].xp;
        
        // Calculate potential decay if borrowing
        if (profiles[user].isBorrowing) {
            uint256 timePassed = block.timestamp - profiles[user].lastDecayTimestamp;
            uint256 decayAmount = timePassed / 1 days;
            if (decayAmount > 0) {
                if (decayAmount >= baseXP) return 0;
                return baseXP - uint8(decayAmount);
            }
        }
        return baseXP;
    }

    /**
     * @dev Synchronizes XP by applying decay before state changes.
     */
    function syncXP(address user) public {
        if (profiles[user].isBorrowing) {
            uint256 timePassed = block.timestamp - profiles[user].lastDecayTimestamp;
            uint8 decayAmount = uint8(timePassed / 1 days);
            
            if (decayAmount > 0) {
                if (profiles[user].xp == 0) profiles[user].xp = 50;
                
                if (decayAmount >= profiles[user].xp) {
                    profiles[user].xp = 0;
                } else {
                    profiles[user].xp -= decayAmount;
                }
                
                profiles[user].lastDecayTimestamp += (uint256(decayAmount) * 1 days);
                emit XPDecayed(user, decayAmount);
                
                if (profiles[user].xp < 15) {
                    profiles[user].isLocked = true;
                    emit UserLocked(user);
                }
            }
        }
    }

    function setIsBorrowing(address user, bool borrowing) external onlyVault {
        syncXP(user);
        profiles[user].isBorrowing = borrowing;
        if (borrowing) {
            profiles[user].lastDecayTimestamp = block.timestamp;
        }
    }

    function updateXP(address user, int8 delta) external onlyVault {
        syncXP(user);
        UserProfile storage profile = profiles[user];
        if (profile.xp == 0) profile.xp = 50;

        int16 newXP = int16(uint16(profile.xp)) + delta;
        if (newXP > 100) newXP = 100;
        if (newXP < 0) newXP = 0;

        profile.xp = uint8(uint16(newXP));
        
        if (profile.xp < 15) {
            profile.isLocked = true;
            emit UserLocked(user);
        } else if (profile.isLocked && profile.xp >= 15) {
            profile.isLocked = false;
            emit UserUnlocked(user);
        }

        emit XPUpdated(user, profile.xp);
    }

    function isUserLocked(address user) external view returns (bool) {
        return profiles[user].isLocked;
    }
}
