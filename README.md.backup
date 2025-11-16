# Charm Crypt Reveal - Privacy-Preserving Rock Paper Scissors

A fully encrypted rock-paper-scissors game built with FHEVM (Fully Homomorphic Encryption Virtual Machine) and Zama's privacy-preserving technology.

## Features

- **Privacy-Preserving**: Player choices are encrypted and never revealed until game completion
- **On-Chain Game Logic**: All game logic and result calculation happens on-chain using encrypted data
- **Rainbow Wallet Integration**: Easy wallet connection using RainbowKit
- **Local & Sepolia Support**: Test locally or deploy to Sepolia testnet

## Project Structure

```
charm-crypt-reveal/
├── contracts/
│   └── RockPaperScissors.sol    # Main game contract
├── test/
│   ├── RockPaperScissors.ts      # Local network tests
│   └── RockPaperScissorsSepolia.ts # Sepolia testnet tests
├── tasks/
│   └── RockPaperScissors.ts      # Hardhat tasks for interaction
├── ui/
│   └── src/
│       ├── components/
│       │   └── RockPaperScissorsGame.tsx  # Game UI component
│       └── lib/
│           └── fhevm.ts          # FHEVM integration utilities
└── deploy/
    └── deploy.ts                 # Deployment script
```

## Prerequisites

- Node.js >= 20
- npm >= 7.0.0
- Hardhat node running (for local development)

## Installation

1. Install dependencies:
```bash
npm install
cd ui && npm install
```

2. Set up environment variables (optional):
```bash
# For Sepolia deployment
export INFURA_API_KEY=your_infura_key
export ETHERSCAN_API_KEY=your_etherscan_key
```

## Local Development

### 1. Start Hardhat Node

In one terminal:
```bash
npx hardhat node
```

### 2. Deploy Contract

In another terminal:
```bash
npx hardhat deploy --network localhost
```

This will deploy the RockPaperScissors contract and print the contract address.

### 3. Update Frontend Contract Address

Set the contract address in `ui/.env`:
```
VITE_CONTRACT_ADDRESS=0x...
```

### 4. Start Frontend

```bash
cd ui
npm run dev
```

### 5. Test Contract (Optional)

```bash
# Submit player choice (0=Rock, 1=Scissors, 2=Paper)
npx hardhat --network localhost task:rps-submit-choice --choice 0

# Submit system choice
npx hardhat --network localhost task:rps-submit-system-choice --choice 1

# Get and decrypt result
npx hardhat --network localhost task:rps-get-result
```

## Running Tests

### Local Network Tests

```bash
npx hardhat test test/RockPaperScissors.ts
```

### Sepolia Testnet Tests

First deploy to Sepolia:
```bash
npx hardhat deploy --network sepolia
```

Then run tests:
```bash
npx hardhat test test/RockPaperScissorsSepolia.ts --network sepolia
```

## Game Flow

1. **Player Choice**: Player selects Rock (0), Scissors (1), or Paper (2)
   - Choice is encrypted locally using FHEVM
   - Encrypted choice is submitted to the contract

2. **System Choice**: System generates a random choice (0, 1, or 2)
   - System choice is encrypted
   - Encrypted system choice is submitted to the contract
   - Contract calculates the result using encrypted comparison

3. **Result Decryption**: 
   - Result is decrypted by the player
   - Only the result (0=Draw, 1=Player Wins, 2=System Wins) is revealed
   - Player and system choices remain encrypted

## Contract Functions

- `submitChoice(bytes32 playerChoiceEuint32, bytes calldata inputProof)`: Submit encrypted player choice
- `submitSystemChoice(bytes32 systemChoiceEuint32, bytes calldata inputProof)`: Submit encrypted system choice and calculate result
- `getGame(address player)`: Get game state (encrypted choices and result)
- `getGameCount(address player)`: Get number of games played by a player

## Frontend Usage

1. Connect your wallet using RainbowKit (top right)
2. Ensure you're on the correct network (localhost:31337 or Sepolia:11155111)
3. Select your choice (Rock, Scissors, or Paper)
4. Wait for transaction confirmation
5. Click "Submit System Choice" to complete the game
6. Result will be automatically decrypted and displayed

## Technologies

- **Solidity**: Smart contract development
- **FHEVM**: Fully Homomorphic Encryption for privacy
- **Hardhat**: Development environment
- **React + TypeScript**: Frontend framework
- **RainbowKit + Wagmi**: Wallet connection
- **Vite**: Build tool
- **Tailwind CSS**: Styling

## License

MIT
