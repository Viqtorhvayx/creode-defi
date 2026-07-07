# CREODE DeFi Protocol

![Creode Dashboard](https://frontend-weld-iota-18.vercel.app/og-image.png)

An industrial-grade decentralized finance protocol engineered for the Hedera Testnet, focusing on asset optimization, reputation-based credit, and structured liquidity provision.

**Engineered by [Viqtorhvayx]**

---

## 🚀 Unique Features

### 1. Saving & Structured Locking
*   **Time-Locked Deposits**: Support for HBAR and Stablecoins (USDT/USDC via HTS). Users set a specific future withdrawal date upon deposit.
*   **3-Week Yield Cycle**: HBAR deposits earn a fixed **0.3% yield** applied precisely every 21 days.
*   **Early Liquidation Penalty**: A **5% penalty** is enforced on any withdrawals made before the preset maturity date, directed to the Protocol Treasury.

### 2. Liquidity Provision (Lending)
*   **Points-Based Incentive**: Instead of immediate yield, liquidity providers earn **Lending Points** based on the volume and duration of assets provided.
*   **Asset Support**: Native HBAR and major HTS stablecoins.

### 3. Reputation-Based Borrowing (XP System)
*   **Borrowing XP**: A non-transferable reputation metric that determines a user's creditworthiness.
*   **Dynamic LTV**: Your Loan-to-Value (LTV) ratio scales with your XP. Higher XP unlocks better borrowing terms.
*   **Safety Gating**: Borrowing is automatically locked if a user's XP falls below the critical threshold (15 XP).

---

## 🛠️ Smart Contract Architecture

The protocol is built on two core Solidity contracts deployed on the Hedera EVM:

*   **`CreodeXP.sol`**: Manages the reputation layer. Handles XP minting, burning, and balance tracking. Ownership is typically transferred to the Vault for automated updates.
*   **`CreodeVault.sol`**: The central logic engine. Manages asset locking, yield calculations, point generation, and collateralized borrowing. Integrates directly with the XP system to enforce credit limits.

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
