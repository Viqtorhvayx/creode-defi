// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IMintableERC20 {
    function mint(address to, uint256 amount) external;
    function decimals() external view returns (uint8);
}

/**
 * @title CreodeFaucet
 * @notice Testnet faucet: lets any user claim a fixed amount of each supported
 *         token once per cooldown window (default 24h), to fund dapp testing.
 *         Relies on the MockERC20 open `mint()`.  Testnet only.
 */
contract CreodeFaucet is Ownable {
    /// @notice Whole-token amount dropped per token per claim (scaled by decimals at claim time).
    uint256 public dripWhole = 200;
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
            IMintableERC20 t = IMintableERC20(tokens[i]);
            uint256 amount = dripWhole * (10 ** t.decimals());
            t.mint(msg.sender, amount);
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
}
