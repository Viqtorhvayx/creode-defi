// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CreodeXP
 * @author Viqtorhvayx
 * @dev Manages the reputation score (XP) for the CREODE DeFi ecosystem.
 */
contract CreodeXP {
    struct UserProfile {
        uint8 xp;
        uint256 lastDefaultRepaymentTime;
        bool isLocked;
    }

    mapping(address => UserProfile) public profiles;
    address public owner;

    event XPUpdated(address indexed user, uint8 newXP);
    event UserLocked(address indexed user);
    event UserUnlocked(address indexed user);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only Viqtorhvayx can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function getXP(address user) external view returns (uint8) {
        return profiles[user].xp == 0 ? 50 : profiles[user].xp; // Default XP is 50
    }

    function updateXP(address user, int8 delta) external {
        // In a real scenario, this would be restricted to the Vault contract
        UserProfile storage profile = profiles[user];
        if (profile.xp == 0) profile.xp = 50;

        int16 newXP = int16(uint16(profile.xp)) + delta;
        if (newXP > 100) newXP = 100;
        if (newXP < 0) newXP = 0;

        profile.xp = uint8(uint16(newXP));
        
        if (profile.xp < 15) {
            profile.isLocked = true;
            emit UserLocked(user);
        }

        emit XPUpdated(user, profile.xp);
    }

    function unlockUser(address user) external {
        // Placeholder for cooldown and repayment check logic
        UserProfile storage profile = profiles[user];
        require(profile.xp >= 15, "XP still too low");
        profile.isLocked = false;
        emit UserUnlocked(user);
    }

    function isUserLocked(address user) external view returns (bool) {
        return profiles[user].isLocked;
    }
}
