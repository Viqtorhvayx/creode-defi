// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

/// Minimal subset of Hedera's IHederaTokenService (system contract at 0x167)
/// covering fungible-token creation, minting, association and transfer.
interface IHederaTokenService {
    struct KeyValue {
        bool inheritAccountKey;
        address contractId;
        bytes ed25519;
        bytes ECDSA_secp256k1;
        address delegatableContractId;
    }

    struct TokenKey {
        uint256 keyType;
        KeyValue key;
    }

    struct Expiry {
        int64 second;
        address autoRenewAccount;
        int64 autoRenewPeriod;
    }

    struct HederaToken {
        string name;
        string symbol;
        address treasury;
        string memo;
        bool tokenSupplyType; // false = infinite, true = finite
        int64 maxSupply;
        bool freezeDefault;
        TokenKey[] tokenKeys;
        Expiry expiry;
    }

    function createFungibleToken(
        HederaToken memory token,
        int64 initialTotalSupply,
        int32 decimals
    ) external payable returns (int64 responseCode, address tokenAddress);

    function mintToken(
        address token,
        int64 amount,
        bytes[] memory metadata
    ) external returns (int64 responseCode, int64 newTotalSupply, int64[] memory serialNumbers);

    function associateToken(address account, address token)
        external
        returns (int64 responseCode);

    function transferToken(address token, address sender, address receiver, int64 amount)
        external
        returns (int64 responseCode);
}
