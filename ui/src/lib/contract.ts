// Contract addresses for different networks
const CONTRACT_ADDRESSES: Record<number, string> = {
  31337: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // localhost (Hardhat) - from deployments/localhost/RockPaperScissors.json
  11155111: "0x3cD654E3F1033A85D026B81a8C9f1Bf31425e997", // Sepolia testnet - deployed on 2025-01-15
};

// Get contract address based on chainId
// Falls back to environment variable or localhost address if chainId is not found
export function getContractAddress(chainId?: number): string {
  // If chainId is provided and exists in our mapping, use it
  if (chainId && CONTRACT_ADDRESSES[chainId]) {
    return CONTRACT_ADDRESSES[chainId];
  }
  
  // Fallback to environment variable
  if (import.meta.env.VITE_CONTRACT_ADDRESS) {
    return import.meta.env.VITE_CONTRACT_ADDRESS;
  }
  
  // Default to localhost address
  return CONTRACT_ADDRESSES[31337];
}

// Default contract address (for backward compatibility)
// Use getContractAddress(chainId) instead when chainId is available
export const CONTRACT_ADDRESS = CONTRACT_ADDRESSES[31337];

