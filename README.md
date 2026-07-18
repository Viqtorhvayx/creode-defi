# CREODE DeFi Protocol

![Creode Dashboard](https://frontend-weld-iota-18.vercel.app/og-image.png)

An industrial-grade decentralized finance protocol engineered for the Hedera Testnet, focusing on asset optimization, reputation-based credit, and structured liquidity provision.

**Engineered by [Viqtorhvayx]**

---

## 🚀 Unique Features

### 1. Saving & Structured Locking
*   **Time-Locked Deposits**: Support for HBAR and Stablecoins (USDT/USDC via HTS). Users set a specific future withdrawal date upon deposit.
*   **3-Week Yield Cycle**: HBAR deposits earn a fixed **0.3% yield** applied precisely every 21 days.
*   **Early Liquidation Penalty**: A time-decaying penalty of **up to 2%** on principal is enforced on withdrawals made before the preset maturity date, directed to the Protocol Treasury. Accrued yield is still paid out in full.

### 2. Earn (Yield Hub)
*   **Rate Discovery**: Browse live APY tiers across supported assets to find the best yield before locking.

### 3. Peer-to-Peer Trading
*   **Direct Trading**: Trade assets peer-to-peer with live price/candle charting.

---

## 🛠️ Smart Contract Architecture

The protocol is built on a single core Solidity contract deployed on the Hedera EVM:

*   **`CreodeVault.sol`**: The central logic engine (Solidity `^0.8.20`, OpenZeppelin `AccessControl` / `ReentrancyGuard` / `Pausable` / `SafeERC20`). Manages multi-token asset locking, tiered APY with linear interpolation, a hard-capped global entry fee (0.25%, max 1%), matured withdrawals, and time-decaying early-exit penalties (up to 2%).

> **Assets:** native **HBAR** (`address(0)`, deposited via `msg.value` — no wrapping) plus **HTS fungible tokens** (created via the Hedera Token Service precompile, so they're visible in HashPack and expose the ERC20 interface).
>
> **Yield & Treasury model:** Principal is custodied by the vault. For **HTS tokens**, yield is funded from the **Treasury** and pulled via allowance (`transferFrom`) at exit — the Treasury must `approve` the vault and hold a balance. For **native HBAR**, yield is paid from a **HBAR reserve pre-funded into the vault** (`fundHbarReserve`), since a contract cannot pull native HBAR from an account.

---

## 💻 Local Setup

### Prerequisites
*   Node.js (v18+ recommended)
*   npm or yarn
*   Git

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Viqtorhvayx/creode-defi.git
    cd creode-defi
    ```

2.  **Install Frontend Dependencies**:
    ```bash
    cd frontend
    npm install
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

---

## ⚙️ Environment Configuration

To enable full blockchain functionality, create a `.env.local` file in the `frontend` directory:

```env
# Hedera Network Configuration
NEXT_PUBLIC_HEDERA_NETWORK=testnet

# Wallet Connection (MetaMask / EVM)
NEXT_PUBLIC_HEDERA_JSON_RPC_URL=https://testnet.hashio.io/api
NEXT_PUBLIC_CHAIN_ID=296

# Wallet Connection (HashPack / Native)
NEXT_PUBLIC_HASHCONNECT_PROJECT_ID=7ac375b7ac375b7ac375b7ac375b7ac3

# Contract Addresses (Update after deployment)
NEXT_PUBLIC_VAULT_ADDRESS=0x...
NEXT_PUBLIC_XP_ADDRESS=0x...
```

### Wallet Setup
*   **MetaMask**: Add the Hedera Testnet manually if prompted (RPC: `https://testnet.hashio.io/api`, Chain ID: `296`).
*   **HashPack**: Ensure you have the HashPack extension installed and set to **Testnet**.

---

## 🛡️ License & Attribution

This project is the intellectual property of **[Viqtorhvayx]**. 

Designed with an industrial aesthetic: *Form follows function.*
All operations are governed by immutable smart contracts on the Hedera network.
