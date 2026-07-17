// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @notice Test-only ERC20 used to stand in for HTS tokens on Hedera testnet
 *         (HTS native minting requires gRPC, which is unavailable in some
 *         environments). The CreodeVault interacts via IERC20, so a plain
 *         ERC20 is a drop-in substitute. Includes an OPEN faucet mint — do
 *         not use on mainnet.
 */
contract MockERC20 is ERC20 {
    uint8 private immutable _decimals;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 initialSupply,
        address treasury
    ) ERC20(name_, symbol_) {
        _decimals = decimals_;
        if (initialSupply > 0) {
            _mint(treasury, initialSupply);
        }
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /// @notice Open faucet: anyone can mint themselves test tokens. Testnet only.
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
