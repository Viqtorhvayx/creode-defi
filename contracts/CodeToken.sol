// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CodeToken (CODE)
 * @notice Creode's governance token. Holding CODE is what grants voting power
 *         in {CreodeGovernance}: one CODE = one vote, read live from the
 *         holder's balance at the moment they propose or cast a vote.
 *
 *         On mainnet CODE would be earned/streamed for real protocol usage
 *         (the same activity that mints "CODE points"). On this TESTNET
 *         deployment there is no real value at stake, so a public {claim}
 *         mints a one-time allocation to any address — this lets anyone try
 *         governance end-to-end (claim → propose → vote) without a faucet trip.
 */
contract CodeToken is ERC20, Ownable {
    /// @notice One-time testnet allocation handed out by {claim} (10,000 CODE).
    uint256 public constant CLAIM_AMOUNT = 10_000 ether;

    mapping(address => bool) public claimed;

    event Claimed(address indexed user, uint256 amount);

    constructor(address treasury) ERC20("Creode CODE", "CODE") Ownable(msg.sender) {
        // Seed a governance treasury so the protocol itself holds voting weight.
        if (treasury != address(0)) _mint(treasury, 1_000_000 ether);
    }

    /// @notice Testnet only: mint yourself a one-time CODE allocation to vote with.
    function claim() external {
        require(!claimed[msg.sender], "CODE: already claimed");
        claimed[msg.sender] = true;
        _mint(msg.sender, CLAIM_AMOUNT);
        emit Claimed(msg.sender, CLAIM_AMOUNT);
    }

    /// @notice Owner mint (treasury top-ups, grants).
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
