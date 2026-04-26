# DedlyFi Staking Platform

A decentralized staking platform that allows users to stake their crypto assets across multiple DeFi protocols (Aave, Uniswap, Lido) through a unified interface.

## 🏗️ Project Structure

```
poc-stake/
├── frontend/          # Next.js 14 frontend application
├── backend/           # Express.js backend API
└── contracts/         # Solidity smart contracts (Hardhat)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MetaMask or compatible Web3 wallet

### 1. Clone and Install

```bash
git clone <repository-url>
cd poc-stake
npm install
```

All dependencies for the backend, frontend, and contracts are installed once from the project root.

### 2. Start Development Servers

```bash
npm start
```

This runs the backend (`http://localhost:4001`) and frontend (`http://localhost:3000`) together.

Visit `http://localhost:3000` to see the app.

### 3. Smart Contracts (Optional)

```bash
# Compile contracts
npm run contracts:compile

# Run tests
npm run contracts:test

# Deploy to Sepolia
npm run contracts:deploy

# Deploy to local Hardhat network
npm run contracts:deploy:local
```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run backend + frontend in development mode |
| `npm run build` | Build backend and frontend for production |
| `npm run contracts:compile` | Compile Solidity contracts |
| `npm run contracts:test` | Run Hardhat tests |
| `npm run contracts:deploy` | Deploy contracts to Sepolia |

## 🔐 Security

- Never commit `.env` files
- Use separate wallets for development and production
- Audit smart contracts before mainnet deployment
- Keep private keys secure

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome!
