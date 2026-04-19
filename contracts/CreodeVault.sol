// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CreodeXP.sol";

/**
 * @title CreodeVault
 * @author Viqtorhvayx
 * @dev Main DeFi hub for CREODE on Hedera Testnet.
 * Features: Saving/Locking (with HBAR Yield), Lending (Points), and Borrowing (XP-Based).
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
        uint256 borrowedAmount;
        uint256 borrowTime;
    }

    mapping(address => LockSession[]) public userLocks;
    mapping(address => uint256) public lendingPoints;
    mapping(address => BorrowPosition) public borrowPositions;

    uint256 public constant EARLY_WITHDRAWAL_PENALTY = 5; // 5%
    uint256 public constant HBAR_STAKING_YIELD = 30; // 0.3% (scaled by 10000)
    uint256 public constant YIELD_INTERVAL = 3 weeks;

    event Deposited(address indexed user, uint256 amount, uint256 unlockTime);
    event Withdrawn(address indexed user, uint256 amount, uint256 penalty);
    event PointsEarned(address indexed user, uint256 points);
    event Borrowed(address indexed user, uint256 amount, uint8 xpAtBorrow);

    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized: Only Viqtorhvayx");
        _;
    }

    constructor(address _xpContract, address _treasury) {
        owner = msg.sender;
        xpContract = CreodeXP(_xpContract);
        treasury = _treasury;
    }

    // --- 1. SAVING & LOCKING ---

    /**
     * @dev Deposit HBAR for a fixed duration.
     */
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

    /**
     * @dev Deposit Stablecoins (USDC/USDT) for a fixed duration.
     */
    function lockToken(address _token, uint256 _amount, uint256 _durationSeconds) external {
        // In Hedera, you'd use HTS precompile here
        // SafeTransferFrom(_token, msg.sender, address(this), _amount)
        
        uint256 unlockTime = block.timestamp + _durationSeconds;
        userLocks[msg.sender].push(LockSession({
            amount: _amount,
            unlockTime: unlockTime,
            isHbar: false,
            tokenAddress: _token,
            withdrawn: false
        }));

        emit Deposited(msg.sender, _amount, unlockTime);
    }

    /**
     * @dev Withdraw locked funds. Applies 5% penalty if withdrawn early.
     * Earns 0.3% yield every 3 weeks for HBAR only.
     */
    function withdrawLock(uint256 _index) external {
        LockSession storage session = userLocks[msg.sender][_index];
        require(!session.withdrawn, "Already withdrawn");
        
        uint256 amountToReturn = session.amount;
        uint256 penalty = 0;

        if (block.timestamp < session.unlockTime) {
            penalty = (session.amount * EARLY_WITHDRAWAL_PENALTY) / 100;
            amountToReturn -= penalty;
            // Transfer penalty to treasury
            _transferFunds(treasury, penalty, session.isHbar, session.tokenAddress);
        } else {
            // Apply yield if HBAR
            if (session.isHbar) {
                uint256 intervals = (block.timestamp - (session.unlockTime - (session.unlockTime % YIELD_INTERVAL))) / YIELD_INTERVAL;
                if (intervals > 0) {
                    uint256 yield = (session.amount * HBAR_STAKING_YIELD * intervals) / 10000;
                    amountToReturn += yield;
                }
            }
        }

        session.withdrawn = true;
        _transferFunds(msg.sender, amountToReturn, session.isHbar, session.tokenAddress);

        emit Withdrawn(msg.sender, amountToReturn, penalty);
    }

    // --- 2. LENDING ---

    /**
     * @dev Provide liquidity to earn Points.
     */
    function lendFunds(uint256 _amount, bool _isHbar) external payable {
        if (_isHbar) require(msg.value == _amount, "Value mismatch");
        
        // Calculation: Points = volume * duration (simplified for MVP)
        // In a full impl, we'd track timestamp and update on next action
        lendingPoints[msg.sender] += (_amount / 1e18); // Basic point per unit
        
        emit PointsEarned(msg.sender, lendingPoints[msg.sender]);
    }

    /**
     * @dev Placeholder for converting points to yield.
     */
    function convertPointsToYield() external {
        uint256 points = lendingPoints[msg.sender];
        require(points > 0, "No points to convert");
        
        // Logic for yield distribution goes here
        lendingPoints[msg.sender] = 0;
    }

    // --- 3. BORROWING & XP ---

    /**
     * @dev Borrow HBAR using Stablecoin as collateral.
     * XP affects LTV (Loan-to-Value).
     */
    function borrowHbar(uint256 _collateralAmount, address _collateralToken) external {
        require(!xpContract.isUserLocked(msg.sender), "Borrowing locked: Low XP");
        uint8 userXP = xpContract.getXP(msg.sender);
        require(userXP >= 15, "XP below threshold");

        // Dynamic LTV based on XP: (XP / 100) * 80% (max LTV)
        uint256 ltv = (uint256(userXP) * 80) / 100; 
        uint256 borrowLimit = (_collateralAmount * ltv) / 100;

        borrowPositions[msg.sender] = BorrowPosition({
            collateralAmount: _collateralAmount,
            borrowedAmount: borrowLimit,
            borrowTime: block.timestamp
        });

        // Update XP for active participation
        xpContract.updateXP(msg.sender, 2);

        emit Borrowed(msg.sender, borrowLimit, userXP);
    }

    /**
     * @dev Repay borrowed HBAR and restore XP.
     */
    function repayHbar() external payable {
        BorrowPosition storage pos = borrowPositions[msg.sender];
        require(msg.value >= pos.borrowedAmount, "Insufficient repayment");

        // Logic for returning collateral and clearing position
        delete borrowPositions[msg.sender];
        
        xpContract.updateXP(msg.sender, 5); // XP boost for repayment
    }

    // --- Helpers ---

    function _transferFunds(address _to, uint256 _amount, bool _isHbar, address _token) internal {
        if (_isHbar) {
            payable(_to).transfer(_amount);
        } else {
            // HTS Token Transfer Logic
        }
    }

    receive() external payable {}
}
