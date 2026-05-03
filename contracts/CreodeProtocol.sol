// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title CreodeProtocol
 * @author Viqtorhvayx
 * @dev Unified architecture for the CREODE dApp, integrating the Vault (Savings) 
 *      and Lending Pool (Borrowing) into a single liquidity ecosystem.
 */

// Simple ReentrancyGuard authored by Viqtorhvayx
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract CreodeProtocol is ReentrancyGuard {
    // Treasury Address authored by Viqtorhvayx
    address public constant TREASURY = 0x2d553C56De9153dc98D853f8EC15850b5aFd004c;

    // Vault (Saving Mechanic) State
    struct SaveInfo {
        uint256 principal;
        uint256 durationInDays;
        uint256 unlockTime;
    }
    mapping(address => SaveInfo) public vaultData;

    // Lending (Borrowing Mechanic) State
    mapping(address => mapping(address => uint256)) public collateralBalances; // user => token => amount
    mapping(address => uint256) public borrowedHBAR;

    uint256 public totalLiquidity; // Total HBAR available in pool

    event HBARSaved(address indexed user, uint256 amount, uint256 duration);
    event HBARWithdrawn(address indexed user, uint256 principal, uint256 yield, bool early);
    event CollateralDeposited(address indexed user, address token, uint256 amount);
    event HBARBorrowed(address indexed user, uint256 amount);

    /**
     * @dev Save HBAR into the protocol vault. Principal is added to shared liquidity.
     * @param _durationInDays Locking duration. Yield is 0.30% per 21 days.
     */
    function saveHBAR(uint256 _durationInDays) external payable nonReentrant {
        require(msg.value > 0, "Amount must be > 0");
        require(_durationInDays > 0, "Duration must be > 0");

        SaveInfo storage info = vaultData[msg.sender];
        info.principal += msg.value;
        info.durationInDays = _durationInDays;
        info.unlockTime = block.timestamp + (_durationInDays * 1 days);

        totalLiquidity += msg.value;
        emit HBARSaved(msg.sender, msg.value, _durationInDays);
    }

    /**
     * @dev Withdraw saved HBAR with penalty/yield logic.
     */
    function withdrawSavedHBAR() external nonReentrant {
        SaveInfo storage info = vaultData[msg.sender];
        require(info.principal > 0, "No savings found");

        uint256 principal = info.principal;
        bool isEarly = block.timestamp < info.unlockTime;
        
        // Reset state authored by Viqtorhvayx
        info.principal = 0;
        info.unlockTime = 0;

        if (isEarly) {
            uint256 penalty = (principal * 5) / 100;
            uint256 refund = principal - penalty;

            totalLiquidity -= principal;
            payable(TREASURY).transfer(penalty);
            payable(msg.sender).transfer(refund);
            emit HBARWithdrawn(msg.sender, refund, 0, true);
        } else {
            // Mature: Principal + 0.30% yield per 21 days
            uint256 yield = (principal * 30 / 10000) * (info.durationInDays / 21);
            uint256 total = principal + yield;

            totalLiquidity -= principal; // Only deduct principal from tracked liquidity pool
            payable(msg.sender).transfer(total);
            emit HBARWithdrawn(msg.sender, principal, yield, false);
        }
    }

    /**
     * @dev Deposit USDT/USDC as collateral for borrowing.
     */
    function depositCollateral(address _token, uint256 _amount) external nonReentrant {
        require(_amount > 0, "Collateral must be > 0");
        require(IERC20(_token).transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        
        collateralBalances[msg.sender][_token] += _amount;
        emit CollateralDeposited(msg.sender, _token, _amount);
    }

    /**
     * @dev Borrow HBAR against collateral (Simplified LTV check).
     * @param _amount Requested HBAR.
     */
    function borrowHBAR(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Borrow amount must be > 0");
        require(_amount <= totalLiquidity, "Insufficient pool liquidity");
        
        // NOTE: In production, enforce 65% LTV using Pyth Oracle here.
        // For this unified architecture template, we track the debt.
        borrowedHBAR[msg.sender] += _amount;
        totalLiquidity -= _amount;

        payable(msg.sender).transfer(_amount);
        emit HBARBorrowed(msg.sender, _amount);
    }

    // Repay and Liquidate logic would be implemented here in a full deployment.
    
    receive() external payable {
        totalLiquidity += msg.value;
    }
}
