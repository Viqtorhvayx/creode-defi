// SPDX-License-Identifier: MIT
// Creator: [Viqtorhvayx]
// Project: CREODE Vault (HBAR Time-Locked Savings with APY)

pragma solidity ^0.8.0;

/**
 * @title CreodeVault
 * @notice A professional, zero-dependency HBAR vault with maturity locks and static yield.
 * @dev Authored by [Viqtorhvayx]
 */
contract CreodeVault {
    // Reentrancy Guard
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call detected");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    // Official Treasury address (Hedera Account 0.0.8665514)
    address public constant TREASURY = 0x2d553C56de9153dC98d853f8ec15850b5AFD004c;
    
    // Constants
    uint256 public constant PROTOCOL_FEE_BASIS_POINTS = 10; // 0.1%
    uint256 public constant EARLY_WITHDRAWAL_PENALTY_BASIS_POINTS = 500; // 5%
    uint256 public constant APY_BASIS_POINTS = 30; // 0.30%
    uint256 public constant SECONDS_IN_YEAR = 31536000;

    uint256 public accumulatedFees;

    struct UserVault {
        uint256 principal;
        uint256 depositTimestamp;
        uint256 maturityTimestamp;
        bool isMaturitySet;
    }

    mapping(address => UserVault) public vaults;

    event MaturitySet(address indexed user, uint256 maturityDate);
    event Deposited(address indexed user, uint256 amount, uint256 fee);
    event Withdrawn(address indexed user, uint256 amount, uint256 yield, uint256 penalty);

    constructor() {
        _status = _NOT_ENTERED;
    }

    /**
     * @notice Set the maturity date for the vault. Must be done before deposit.
     * @param durationDays Number of days to lock funds.
     */
    function setMaturity(uint256 durationDays) external {
        require(durationDays > 0, "Duration must be greater than zero days");
        require(vaults[msg.sender].principal == 0, "Cannot change maturity date while you have an active deposit");
        
        vaults[msg.sender].maturityTimestamp = block.timestamp + (durationDays * 1 days);
        vaults[msg.sender].isMaturitySet = true;
        
        emit MaturitySet(msg.sender, vaults[msg.sender].maturityTimestamp);
    }

    /**
     * @notice Deposit native HBAR. Maturity must be set first.
     */
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Deposit amount must be greater than zero");
        require(vaults[msg.sender].isMaturitySet, "You must set a maturity date first");

        uint256 protocolFee = (msg.value * PROTOCOL_FEE_BASIS_POINTS) / 10000;
        uint256 netDeposit = msg.value - protocolFee;

        // Accumulate fee instead of sending immediately to avoid .call revert issues
        accumulatedFees += protocolFee;

        vaults[msg.sender].principal += netDeposit;
        vaults[msg.sender].depositTimestamp = block.timestamp;

        emit Deposited(msg.sender, netDeposit, protocolFee);
    }

    /**
     * @notice Calculate current earnings based on 0.30% static APY.
     */
    function calculateEarnings(address user) public view returns (uint256) {
        UserVault memory v = vaults[user];
        if (v.principal == 0) return 0;
        
        uint256 timeElapsed = block.timestamp - v.depositTimestamp;
        // earnings = (principal * APY * time) / (10000 * secondsInYear)
        return (v.principal * APY_BASIS_POINTS * timeElapsed) / (10000 * SECONDS_IN_YEAR);
    }

    /**
     * @notice Withdraw principal + earnings. 5% penalty applies if before maturity.
     */
    function withdraw() external nonReentrant {
        UserVault storage v = vaults[msg.sender];
        require(v.principal > 0, "You do not have any funds in the vault to withdraw");

        uint256 earnings = calculateEarnings(msg.sender);
        uint256 totalBeforePenalty = v.principal + earnings;
        uint256 penalty = 0;
        uint256 finalAmount = totalBeforePenalty;

        if (block.timestamp < v.maturityTimestamp) {
            penalty = (v.principal * EARLY_WITHDRAWAL_PENALTY_BASIS_POINTS) / 10000;
            finalAmount = totalBeforePenalty - penalty;
            // Accumulate penalty instead of sending immediately
            accumulatedFees += penalty;
        }

        // Check if contract has enough balance (e.g. for earnings)
        require(address(this).balance >= finalAmount, "Vault has insufficient liquidity for withdrawal");

        // Reset vault before transfers
        uint256 principalToReset = v.principal;
        v.principal = 0;
        v.isMaturitySet = false;

        // Transfer funds to user
        (bool successUser, ) = payable(msg.sender).call{value: finalAmount}("");
        require(successUser, "Failed to transfer HBAR to user wallet");

        emit Withdrawn(msg.sender, principalToReset, earnings, penalty);
    }

    /**
     * @notice Allows anyone to trigger sending the accumulated fees to the treasury
     */
    function claimFees() external nonReentrant {
        uint256 fees = accumulatedFees;
        require(fees > 0, "There are currently no accumulated fees to claim");
        accumulatedFees = 0;
        (bool success, ) = payable(TREASURY).call{value: fees}("");
        require(success, "Failed to transfer accumulated fees to treasury");
    }

    /**
     * @dev Receive fallback. Defaults to 30-day maturity if not set.
     */
    receive() external payable {
        if (!vaults[msg.sender].isMaturitySet) {
            vaults[msg.sender].maturityTimestamp = block.timestamp + 30 days;
            vaults[msg.sender].isMaturitySet = true;
        }
        
        uint256 protocolFee = (msg.value * PROTOCOL_FEE_BASIS_POINTS) / 10000;
        uint256 netDeposit = msg.value - protocolFee;
        
        accumulatedFees += protocolFee;

        vaults[msg.sender].principal += netDeposit;
        vaults[msg.sender].depositTimestamp = block.timestamp;
    }
}
