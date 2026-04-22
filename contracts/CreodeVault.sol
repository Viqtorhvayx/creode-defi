// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CreodeXP.sol";

/**
 * @title CreodeVault
 * @author Viqtorhvayx
 * @dev Main DeFi hub for CREODE on Hedera Testnet.
 * Features: Saving, Lending, and an overhauled XP-Based Borrowing Infrastructure.
 */
contract CreodeVault {
    // --- State Variables ---
    address public treasury;
    address public owner;
    CreodeXP public xpContract;

    struct LockSession {
        uint256 amount;
        uint256 unlockTime;
        bool isHbar;
        address tokenAddress;
        bool withdrawn;
    }

    struct BorrowPosition {
        uint256 collateralAmount;
        address collateralToken;
        uint256 borrowedAmount;
        uint256 borrowTime;
        bool active;
    }

    mapping(address => LockSession[]) public userLocks;
    mapping(address => uint256) public lendingPoints;
    mapping(address => BorrowPosition) public borrowPositions;

    uint256 public constant EARLY_WITHDRAWAL_PENALTY = 5; 
    uint256 public constant HBAR_STAKING_YIELD = 30; 
    uint256 public constant YIELD_INTERVAL = 3 weeks;

    event Deposited(address indexed user, uint256 amount, uint256 unlockTime);
    event Borrowed(address indexed user, uint256 amount, uint256 collateral);
    event Repaid(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized: Only Viqtorhvayx");
        _;
    }

    constructor(address _xpContract, address _treasury) {
        owner = msg.sender;
        xpContract = CreodeXP(_xpContract);
        treasury = _treasury;
    }

    // --- BORROWING OVERHAUL ---

    /**
     * @dev Borrow HBAR using Stablecoin as collateral.
     * Starting XP is proportional to the Collateralization Ratio.
     */
    function borrowHbar(uint256 _collateralAmount, address _collateralToken, uint256 _borrowAmount) external {
        require(!xpContract.isUserLocked(msg.sender), "Borrowing locked: Low XP");
        require(!borrowPositions[msg.sender].active, "Existing position active");

        // Calculate Collateralization Ratio (CR)
        // Simplified: assuming 1:1 value for logic demonstration
        uint256 ratio = (_collateralAmount * 100) / _borrowAmount;
        require(ratio >= 150, "Collateral below 150%");

        // Dynamic Starting XP: More collateral = higher initial reputation health
        int8 xpDelta = int8(uint8(ratio / 10)); // e.g., 200% ratio = +20 XP bonus
        xpContract.updateXP(msg.sender, xpDelta);

        borrowPositions[msg.sender] = BorrowPosition({
            collateralAmount: _collateralAmount,
            collateralToken: _collateralToken,
            borrowedAmount: _borrowAmount,
            borrowTime: block.timestamp,
            active: true
        });

        // Trigger XP Decay activation in XP contract
        xpContract.setIsBorrowing(msg.sender, true);

        emit Borrowed(msg.sender, _borrowAmount, _collateralAmount);
    }

    /**
     * @dev Step 1: Repay borrowed HBAR.
     * Repayment stops XP decay.
     */
    function repayHbar() external payable {
        BorrowPosition storage pos = borrowPositions[msg.sender];
        require(pos.active, "No active loan");
        require(msg.value >= pos.borrowedAmount, "Insufficient repayment");

        // Stop XP decay immediately
        xpContract.setIsBorrowing(msg.sender, false);
        
        // Grant XP boost for responsible repayment
        xpContract.updateXP(msg.sender, 5);

        pos.borrowedAmount = 0;
        
        emit Repaid(msg.sender, msg.value);
    }

    /**
     * @dev Step 2: Withdraw Collateral.
     * Only possible after Step 1 (Repayment) is fully settled.
     */
    function withdrawCollateral() external {
        BorrowPosition storage pos = borrowPositions[msg.sender];
        require(pos.active, "No position found");
        require(pos.borrowedAmount == 0, "Debt must be cleared first");

        uint256 amount = pos.collateralAmount;
        address token = pos.collateralToken;

        // Reset position
        pos.active = false;
        pos.collateralAmount = 0;

        // Logic for returning token collateral (HTS / ERC20)
        _transferFunds(msg.sender, amount, false, token);

        emit CollateralWithdrawn(msg.sender, amount);
    }

    // --- Existing Core Logic ---

    function lockHbar(uint256 _durationSeconds) external payable {
        require(msg.value > 0, "Amount must be > 0");
        uint256 unlockTime = block.timestamp + _durationSeconds;
        userLocks[msg.sender].push(LockSession({
            amount: msg.value,
            unlockTime: unlockTime,
            isHbar: true,
            tokenAddress: address(0),
            withdrawn: false
        }));
        emit Deposited(msg.sender, msg.value, unlockTime);
    }

    function _transferFunds(address _to, uint256 _amount, bool _isHbar, address _token) internal {
        if (_isHbar) {
            payable(_to).transfer(_amount);
        } else {
            // Token transfer logic
        }
    }

    receive() external payable {}
}
