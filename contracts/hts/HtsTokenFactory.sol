// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IHederaTokenService.sol";

/**
 * @title HtsTokenFactory
 * @notice Creates real HTS fungible tokens from within the EVM via the Hedera
 *         Token Service system contract (0x167). Tokens created this way are
 *         native HTS tokens — visible/associable in HashPack — while still
 *         exposing the ERC20 interface at their EVM address for the vault.
 *         The factory is the treasury + supply-key holder, so it can mint and
 *         distribute. Testnet helper.
 */
contract HtsTokenFactory {
    address constant HTS = address(0x167);
    int64 constant SUCCESS = 22;
    // Key bitmask: supplyKey = 16.
    uint256 constant SUPPLY_KEY = 16;

    address public owner;
    event TokenCreated(address indexed token, string symbol, int64 initialSupply);

    constructor() { owner = msg.sender; }

    modifier onlyOwner() { require(msg.sender == owner, "only owner"); _; }

    function createToken(
        string memory name,
        string memory symbol,
        int32 decimals,
        int64 initialSupply
    ) external payable onlyOwner returns (address tokenAddress) {
        IHederaTokenService.TokenKey[] memory keys = new IHederaTokenService.TokenKey[](1);
        keys[0] = IHederaTokenService.TokenKey({
            keyType: SUPPLY_KEY,
            key: IHederaTokenService.KeyValue({
                inheritAccountKey: false,
                contractId: address(this),
                ed25519: "",
                ECDSA_secp256k1: "",
                delegatableContractId: address(0)
            })
        });

        IHederaTokenService.Expiry memory expiry = IHederaTokenService.Expiry({
            second: 0,
            autoRenewAccount: address(this),
            autoRenewPeriod: 7776000 // ~90 days
        });

        IHederaTokenService.HederaToken memory token = IHederaTokenService.HederaToken({
            name: name,
            symbol: symbol,
            treasury: address(this),
            memo: "",
            tokenSupplyType: false, // infinite
            maxSupply: 0,
            freezeDefault: false,
            tokenKeys: keys,
            expiry: expiry
        });

        (bool success, bytes memory result) = HTS.call{value: msg.value}(
            abi.encodeWithSelector(
                IHederaTokenService.createFungibleToken.selector,
                token,
                initialSupply,
                decimals
            )
        );
        require(success, "HTS call reverted");
        (int64 rc, address addr) = abi.decode(result, (int64, address));
        require(rc == SUCCESS, _codeMsg("create", rc));
        emit TokenCreated(addr, symbol, initialSupply);
        return addr;
    }

    /// @notice Mint more of a token (factory is supply-key holder) into the treasury (this).
    function mint(address token, int64 amount) external onlyOwner {
        (bool s, bytes memory r) = HTS.call(
            abi.encodeWithSelector(IHederaTokenService.mintToken.selector, token, amount, new bytes[](0))
        );
        require(s, "mint reverted");
        int64 rc = abi.decode(r, (int64));
        require(rc == SUCCESS, _codeMsg("mint", rc));
    }

    /// @notice Distribute tokens out of the factory treasury via the ERC20 facade
    ///         (HTS tokens expose ERC20 transfer). Recipient must be associated.
    function sendERC20(address token, address to, uint256 amount) external onlyOwner {
        (bool s, bytes memory r) = token.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );
        require(s && (r.length == 0 || abi.decode(r, (bool))), "ERC20 transfer failed");
    }

    /// @notice Transfer tokens from the factory treasury to a recipient (recipient must be associated).
    function transferOut(address token, address to, int64 amount) external onlyOwner {
        (bool s, bytes memory r) = HTS.call(
            abi.encodeWithSelector(IHederaTokenService.transferToken.selector, token, address(this), to, amount)
        );
        require(s, "transfer reverted");
        int64 rc = abi.decode(r, (int64));
        require(rc == SUCCESS, _codeMsg("transfer", rc));
    }

    function _codeMsg(string memory op, int64 rc) private pure returns (string memory) {
        return string(abi.encodePacked(op, " HTS code ", _toString(rc)));
    }

    function _toString(int64 v) private pure returns (string memory) {
        if (v == 0) return "0";
        uint256 u = uint256(uint64(v));
        bytes memory buf = new bytes(20);
        uint256 i = 20;
        while (u != 0) { i--; buf[i] = bytes1(uint8(48 + u % 10)); u /= 10; }
        bytes memory out = new bytes(20 - i);
        for (uint256 j = 0; j < out.length; j++) out[j] = buf[i + j];
        return string(out);
    }

    receive() external payable {}
}
