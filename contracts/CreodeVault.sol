// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IERC20.sol";

/**
 * @title CreodeVault
 * @notice Vault supporting multiple HTS tokens (via ERC20 interface) and native HBAR.
 * Features:
 * - Dynamic linear interpolation for APY based on lock duration.
 * - Minimum deposit thresholds based on decimals.
 * - 0.25% Entry fee routed to treasury.
 * - Yield retention and up to 2% time-decay penalty on early principal withdrawals.
 */
contract CreodeVault {
    // Reentrancy Guard
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    address public owner;
    address public treasury;

    uint256 public constant PROTOCOL_FEE_BPS = 25; // 0.25% Entry Fee
    uint256 public constant MAX_EARLY_PENALTY_BPS = 200; // 2.00% Max Early Penalty
    uint256 public constant SECONDS_IN_YEAR = 31536000;

    struct TokenConfig {
        bool isActive;
        uint256 minDeposit;
        uint256 rate7D; // APY in basis points (e.g. 400 for 4.0%)
        uint256 rate30D;
        uint256 rate60D;
    }

    struct UserDeposit {
        address tokenAddress;
        uint256 principal;
        uint256 depositTimestamp;
        uint256 maturityTimestamp;
        uint256 apyBps;
    }

    mapping(address => TokenConfig) public tokenConfigs; // address(0) represents native HBAR
    mapping(address => mapping(uint256 => UserDeposit)) public userDeposits;
    mapping(address => uint256) public userDepositCount;
    mapping(address => uint256) public accumulatedFees;

    event TokenConfigured(address indexed token, uint256 minDeposit, uint256 rate7D, uint256 rate30D, uint256 rate60D);
    event Deposited(address indexed user, uint256 depositId, address indexed token, uint256 principal, uint256 fee, uint256 apyBps, uint256 maturityTimestamp);
    event Withdrawn(address indexed user, uint256 depositId, address indexed token, uint256 principal, uint256 yield, uint256 penalty);
    event FeesClaimed(address indexed token, uint256 amount);

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    constructor(address _treasury) {
        require(_treasury != address(0), "Invalid treasury address");
        treasury = _treasury;
        owner = msg.sender;
        _status = _NOT_ENTERED;
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }

    function configureToken(
        address tokenAddress,
        uint256 minDeposit,
        uint256 rate7D,
        uint256 rate30D,
        uint256 rate60D
    ) external onlyOwner {
        tokenConfigs[tokenAddress] = TokenConfig({
            isActive: true,
            minDeposit: minDeposit,
            rate7D: rate7D,
            rate30D: rate30D,
            rate60D: rate60D
        });
        emit TokenConfigured(tokenAddress, minDeposit, rate7D, rate30D, rate60D);
    }

    function calculateCustomAPY(address token, uint256 durationDays) public view returns (uint256) {
        TokenConfig memory config = tokenConfigs[token];
        require(config.isActive, "Token not active");
        
        if (durationDays <= 7) {
            return config.rate7D;
        } else if (durationDays <= 30) {
            // Linear interpolation between 7D and 30D
            uint256 timeDiff = durationDays - 7;
            uint256 rateDiff = config.rate30D - config.rate7D;
            return config.rate7D + ((rateDiff * timeDiff) / 23); // (30 - 7)
        } else if (durationDays <= 60) {
            // Linear interpolation between 30D and 60D
            uint256 timeDiff = durationDays - 30;
            uint256 rateDiff = config.rate60D - config.rate30D;
            return config.rate30D + ((rateDiff * timeDiff) / 30); // (60 - 30)
        } else {
            // Extrapolate beyond 60 days
            uint256 timeDiff = durationDays - 60;
            uint256 rateDiff = config.rate60D - config.rate30D;
            return config.rate60D + ((rateDiff * timeDiff) / 30);
        }
    }

    function deposit(address token, uint256 amount, uint256 durationDays) external payable nonReentrant {
        require(durationDays > 0, "Duration must be > 0");
        TokenConfig memory config = tokenConfigs[token];
        require(config.isActive, "Token not supported");

        uint256 actualAmount = amount;
        
        if (token == address(0)) {
            require(msg.value > 0, "Msg value must be > 0");
            actualAmount = msg.value;
        } else {
            require(msg.value == 0, "Do not send HBAR with ERC20 deposit");
            require(amount > 0, "Amount must be > 0");
            
            // Transfer ERC20 from user to this contract
            // Make sure the user has approved the contract
            bool success = IERC20(token).transferFrom(msg.sender, address(this), amount);
            require(success, "ERC20 transfer failed");
        }

        require(actualAmount >= config.minDeposit, "Amount below minimum deposit");

        // 25 BPS global entry fee
        uint256 fee = (actualAmount * PROTOCOL_FEE_BPS) / 10000;
        uint256 principal = actualAmount - fee;

        accumulatedFees[token] += fee;

        uint256 apyBps = calculateCustomAPY(token, durationDays);
        uint256 maturity = block.timestamp + (durationDays * 1 days);

        uint256 depositId = userDepositCount[msg.sender];
        userDeposits[msg.sender][depositId] = UserDeposit({
            tokenAddress: token,
            principal: principal,
            depositTimestamp: block.timestamp,
            maturityTimestamp: maturity,
            apyBps: apyBps
        });
        
        userDepositCount[msg.sender]++;

        emit Deposited(msg.sender, depositId, token, principal, fee, apyBps, maturity);
    }

    function withdraw(uint256 depositId) external nonReentrant {
        require(depositId < userDepositCount[msg.sender], "Invalid deposit ID");
        UserDeposit storage dep = userDeposits[msg.sender][depositId];
        require(dep.principal > 0, "Deposit already withdrawn");

        uint256 timeElapsed = block.timestamp - dep.depositTimestamp;
        
        // Accrued Yield = (Principal * APY * Time Elapsed) / (365 days in seconds)
        // APY is in basis points, so divide by 10000
        uint256 yieldAmount = (dep.principal * dep.apyBps * timeElapsed) / (10000 * SECONDS_IN_YEAR);
        
        uint256 penalty = 0;
        if (block.timestamp < dep.maturityTimestamp) {
            uint256 remainingTime = dep.maturityTimestamp - block.timestamp;
            uint256 totalDuration = dep.maturityTimestamp - dep.depositTimestamp;
            
            // Current Penalty % = 2.00% * (Remaining Time / Total Lock Duration)
            // Penalty = (Principal * MaxPenaltyBps * remainingTime) / (totalDuration * 10000)
            penalty = (dep.principal * MAX_EARLY_PENALTY_BPS * remainingTime) / (totalDuration * 10000);
            
            accumulatedFees[dep.tokenAddress] += penalty;
        }

        uint256 finalPrincipal = dep.principal - penalty;
        uint256 totalPayout = finalPrincipal + yieldAmount;
        
        address token = dep.tokenAddress;
        dep.principal = 0; // Burn state to prevent re-entry logic abuse

        if (token == address(0)) {
            require(address(this).balance >= totalPayout, "Insufficient HBAR liquidity");
            (bool success, ) = payable(msg.sender).call{value: totalPayout}("");
            require(success, "HBAR transfer failed");
        } else {
            require(IERC20(token).balanceOf(address(this)) >= totalPayout, "Insufficient ERC20 liquidity");
            require(IERC20(token).transfer(msg.sender, totalPayout), "ERC20 transfer failed");
        }

        emit Withdrawn(msg.sender, depositId, token, finalPrincipal, yieldAmount, penalty);
    }

    function claimFees(address token) external nonReentrant {
        uint256 fees = accumulatedFees[token];
        require(fees > 0, "No fees to claim");
        accumulatedFees[token] = 0;

        if (token == address(0)) {
            (bool success, ) = payable(treasury).call{value: fees}("");
            require(success, "HBAR fee claim failed");
        } else {
            require(IERC20(token).transfer(treasury, fees), "ERC20 fee claim failed");
        }
        
        emit FeesClaimed(token, fees);
    }

    receive() external payable {}
}
