// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IERC20.sol";

/**
 * @title CreodeVault
 * @notice Vault supporting multiple HTS tokens (via ERC20 interface) and native HBAR.
 * Features:
 * - Dynamic linear interpolation for APY based on lock duration.
 * - Minimum deposit thresholds based on decimals.
 * - 0.25% Entry fee routed to treasury atomically on deposit.
 * - Yield paid out of the Treasury (not the Vault's own balance) for HTS tokens,
 *   pulled via a standard ERC20 allowance the Treasury grants this contract.
 * - Up to 2% time-decay penalty on early principal withdrawals, routed to
 *   treasury atomically alongside the withdrawal.
 *
 * IMPORTANT — Treasury funding model:
 * The Vault no longer assumes yield is backed by its own token balance for HTS
 * tokens. Instead, on withdraw() it pulls the accrued yield directly out of the
 * `treasury` address via `IERC20(token).transferFrom(treasury, user, yieldAmount)`.
 * For this to succeed, the Treasury account MUST call
 * `IERC20(token).approve(vaultAddress, <sufficiently large amount>)` for every
 * HTS token configured on this vault, and must hold enough of that token to
 * cover outstanding yield obligations. This contract cannot enforce that the
 * Treasury is actually funded — insufficient Treasury balance/allowance will
 * simply revert the withdrawal.
 *
 * KNOWN LIMITATION — native HBAR yield is NOT pulled from the Treasury.
 * Hedera's native-HBAR allowance-pull mechanism (the HAS/IHRC-632 system
 * contract) is a distinct, less common code path from standard ERC20
 * `transferFrom`, and its exact interface needs to be verified against current
 * Hedera testnet/mainnet docs before being relied on for real fund movement.
 * Rather than guess at that interface in a contract that moves real money,
 * native HBAR yield continues to be paid out of the Vault's own HBAR balance,
 * same as before this change. Revisit this once the HAS allowance flow has
 * been verified end-to-end.
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

    event TokenConfigured(address indexed token, uint256 minDeposit, uint256 rate7D, uint256 rate30D, uint256 rate60D);
    event Deposited(address indexed user, uint256 depositId, address indexed token, uint256 principal, uint256 fee, uint256 apyBps, uint256 maturityTimestamp);
    event Withdrawn(address indexed user, uint256 depositId, address indexed token, uint256 principal, uint256 yield, uint256 penalty);

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

        // 25 BPS global entry fee, routed to treasury atomically.
        uint256 fee = (actualAmount * PROTOCOL_FEE_BPS) / 10000;
        uint256 principal = actualAmount - fee;

        if (fee > 0) {
            _payOut(token, treasury, fee);
        }

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
        }

        uint256 finalPrincipal = dep.principal - penalty;
        address token = dep.tokenAddress;
        dep.principal = 0; // Burn state to prevent re-entry logic abuse

        // Principal (net of any early penalty) is paid from the Vault's own balance.
        _payOut(token, msg.sender, finalPrincipal);

        // Early-withdrawal penalty is routed to the Treasury atomically, same tx.
        if (penalty > 0) {
            _payOut(token, treasury, penalty);
        }

        // Yield is pulled from the Treasury for HTS tokens. Native HBAR yield is
        // still paid from the Vault's own balance — see contract-level comment.
        if (yieldAmount > 0) {
            if (token == address(0)) {
                _payOut(token, msg.sender, yieldAmount);
            } else {
                require(
                    IERC20(token).transferFrom(treasury, msg.sender, yieldAmount),
                    "Yield pull from treasury failed"
                );
            }
        }

        emit Withdrawn(msg.sender, depositId, token, finalPrincipal, yieldAmount, penalty);
    }

    /// @dev Pays `amount` of `token` (address(0) = native HBAR) out of this
    /// contract's own balance to `to`.
    function _payOut(address token, address to, uint256 amount) private {
        if (token == address(0)) {
            require(address(this).balance >= amount, "Insufficient HBAR liquidity");
            (bool success, ) = payable(to).call{value: amount}("");
            require(success, "HBAR transfer failed");
        } else {
            require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient ERC20 liquidity");
            require(IERC20(token).transfer(to, amount), "ERC20 transfer failed");
        }
    }

    receive() external payable {}
}
