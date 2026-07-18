// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IFaucetToken {
    function transfer(address to, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title CreodeFaucet
 * @notice Testnet faucet that hands out a fixed amount of each supported token
 *         once per cooldown. Tokens are HTS tokens (no open mint), so the faucet
 *         holds a reserve and TRANSFERS the drip — fund it after deployment.
 *         Recipients must be able to receive the token (HTS auto-association).
 *         Testnet only.
 */
contract CreodeFaucet is Ownable {
    /// @notice Whole-token amount dropped per token per claim (scaled by decimals).
    uint256 public dripWhole = 50;
    /// @notice Minimum time between a user's claims.
    uint256 public cooldown = 1 days;

    address[] public tokens;
    mapping(address => uint256) public lastClaim;

    event Claimed(address indexed user, uint256 tokenCount, uint256 timestamp);
    event TokensUpdated(uint256 count);
    event DripUpdated(uint256 dripWhole);
    event CooldownUpdated(uint256 cooldown);

    constructor(address[] memory _tokens) Ownable(msg.sender) {
        tokens = _tokens;
        emit TokensUpdated(_tokens.length);
    }

    /// @notice Claim `dripWhole` of every supported token. Once per cooldown per user.
    function claim() external {
        require(block.timestamp >= nextClaimTime(msg.sender), "Faucet: cooldown active");
        lastClaim[msg.sender] = block.timestamp;

        uint256 len = tokens.length;
        for (uint256 i = 0; i < len; i++) {
            IFaucetToken t = IFaucetToken(tokens[i]);
            uint256 amount = dripWhole * (10 ** t.decimals());
            require(t.transfer(msg.sender, amount), "Faucet: drip transfer failed");
        }
        emit Claimed(msg.sender, len, block.timestamp);
    }

    /// @notice Timestamp when `user` may next claim (0 if never claimed → claimable now).
    function nextClaimTime(address user) public view returns (uint256) {
        uint256 last = lastClaim[user];
        return last == 0 ? 0 : last + cooldown;
    }

    /// @notice Seconds remaining until `user` can claim again (0 if claimable now).
    function secondsUntilClaim(address user) external view returns (uint256) {
        uint256 next = nextClaimTime(user);
        return block.timestamp >= next ? 0 : next - block.timestamp;
    }

    function getTokens() external view returns (address[] memory) {
        return tokens;
    }

    // ── Admin ────────────────────────────────────────────────────────────
    function setTokens(address[] calldata _tokens) external onlyOwner {
        tokens = _tokens;
        emit TokensUpdated(_tokens.length);
    }

    function setDrip(uint256 _dripWhole) external onlyOwner {
        dripWhole = _dripWhole;
        emit DripUpdated(_dripWhole);
    }

    function setCooldown(uint256 _cooldown) external onlyOwner {
        cooldown = _cooldown;
        emit CooldownUpdated(_cooldown);
    }

    /// @notice Reclaim leftover reserve of a token to the owner.
    function sweep(address token, address to, uint256 amount) external onlyOwner {
        require(IFaucetToken(token).transfer(to, amount), "sweep failed");
    }
}
