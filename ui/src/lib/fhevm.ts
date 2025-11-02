
// Enhanced encryption handling

// Enhanced encryption handling

// Enhanced encryption handling
// FHEVM SDK utilities for frontend
import { ethers } from "ethers";
import { JsonRpcProvider } from "ethers";

// Import @zama-fhe/relayer-sdk (static import like quiet-key-cast)
// Note: Requires UMD bundle to be loaded in index.html
import { createInstance, initSDK, SepoliaConfig } from "@zama-fhe/relayer-sdk/bundle";
import type { FhevmInstance } from "@zama-fhe/relayer-sdk/bundle";

// Import @fhevm/mock-utils for localhost mock FHEVM
let MockFhevmInstance: any = null;
let userDecryptHandleBytes32: any = null;

export interface EncryptedInput {
  handles: string[];
  inputProof: string;
}

export enum FhevmType {
  euint8 = 0,
  euint16 = 1,
  euint32 = 2,
  euint64 = 3,
  euint128 = 4,
  euint256 = 5,
}

let fhevmInstance: FhevmInstance | null = null;
let isSDKInitialized = false;

/**
 * Initialize FHEVM instance
 * Local network (31337): Uses @fhevm/mock-utils + Hardhat plugin
 * Sepolia (11155111): Uses @zama-fhe/relayer-sdk
 */
export async function initializeFHEVM(chainId?: number): Promise<FhevmInstance> {
  if (!fhevmInstance) {
    // Check window.ethereum
    if (typeof window === "undefined" || !(window as any).ethereum) {
      throw new Error("window.ethereum is not available. Please install MetaMask.");
    }

    // Get chainId first
    let currentChainId = chainId;
    if (!currentChainId) {
      try {
        const chainIdHex = await (window as any).ethereum.request({ method: "eth_chainId" });
        currentChainId = parseInt(chainIdHex, 16);
      } catch (error) {
        console.error("[FHEVM] Failed to get chainId:", error);
        currentChainId = 31337;
      }
    }

    console.log("[FHEVM] Current chain ID:", currentChainId);

    // Initialize SDK for Sepolia only (following quiet-key-cast pattern)
    if (currentChainId === 11155111 && !isSDKInitialized) {
      console.log("[FHEVM] Initializing FHE SDK for Sepolia...");
      
      try {
        await initSDK();
        isSDKInitialized = true;
        console.log("[FHEVM] ‚ú?SDK initialized successfully");
      } catch (error: any) {
        console.error("[FHEVM] SDK initialization failed:", error);
        console.warn("[FHEVM] Continuing with createInstance...");
      }
    }

    // Local network: Use Mock FHEVM
    if (currentChainId === 31337) {
      const localhostRpcUrl = "http://localhost:8545";

      try {
        console.log("[FHEVM] Fetching FHEVM metadata from Hardhat node...");
        const provider = new JsonRpcProvider(localhostRpcUrl);
        const metadata = await provider.send("fhevm_relayer_metadata", []);

        console.log("[FHEVM] Metadata:", metadata);

        if (metadata && metadata.ACLAddress && metadata.InputVerifierAddress && metadata.KMSVerifierAddress) {
          // Use @fhevm/mock-utils to create mock instance
          if (!MockFhevmInstance || !userDecryptHandleBytes32) {
            const mockUtils = await import("@fhevm/mock-utils");
            MockFhevmInstance = mockUtils.MockFhevmInstance;
            userDecryptHandleBytes32 = mockUtils.userDecryptHandleBytes32;
            console.log("[FHEVM] ‚ú?Loaded mock-utils:", {
              hasMockInstance: !!MockFhevmInstance,
              hasDecryptFunc: !!userDecryptHandleBytes32
            });
          }

          console.log("[FHEVM] Creating MockFhevmInstance with addresses:", {
            ACL: metadata.ACLAddress,
            InputVerifier: metadata.InputVerifierAddress,
            KMSVerifier: metadata.KMSVerifierAddress,
          });

          const mockInstance = await MockFhevmInstance.create(provider, provider, {
            aclContractAddress: metadata.ACLAddress,
            chainId: 31337,
            gatewayChainId: 55815,
            inputVerifierContractAddress: metadata.InputVerifierAddress,
            kmsContractAddress: metadata.KMSVerifierAddress,
            verifyingContractAddressDecryption: "0x5ffdaAB0373E62E2ea2944776209aEf29E631A64",
            verifyingContractAddressInputVerification: "0x812b06e1CDCE800494b79fFE4f925A504a9A9810",
          });

          fhevmInstance = mockInstance;
          console.log("[FHEVM] Mock FHEVM instance created successfully!");
          return mockInstance;
        } else {
          throw new Error("FHEVM metadata is incomplete");
        }
      } catch (error: any) {
        console.error("[FHEVM] Failed to create Mock instance:", error);
        throw new Error(
          `Local Hardhat node FHEVM initialization failed: ${error.message}\n\n` +
          `Please ensure:\n` +
          `1. Hardhat node is running (npx hardhat node)\n` +
          `2. @fhevm/hardhat-plugin is imported in hardhat.config.ts\n` +
          `3. Restart Hardhat node and retry`
        );
      }
    }

    // Sepolia network: Use official SDK with MetaMask provider to avoid CORS
    else if (currentChainId === 11155111) {
      try {
        console.log("[FHEVM] Creating Sepolia FHEVM instance...");
        
        // Use MetaMask's provider instead of public RPC to avoid CORS issues
        if (typeof window === "undefined" || !(window as any).ethereum) {
          throw new Error("MetaMask not detected. Please install MetaMask to use Sepolia network.");
        }
        
        // Create config using MetaMask provider (no CORS issues)
        const config = {
          ...SepoliaConfig,
          network: (window as any).ethereum,  // Use MetaMask provider
        };
        
        fhevmInstance = await createInstance(config);
        console.log("[FHEVM] ‚ú?Sepolia FHEVM instance created successfully!");
      } catch (error: any) {
        console.error("[FHEVM] ‚ù?Sepolia instance creation failed:", error);
        throw new Error(
          `Failed to create Sepolia FHEVM instance: ${error.message || "Unknown error"}`
        );
      }
    }

    else {
      throw new Error(`Unsupported network (Chain ID: ${currentChainId}). Please switch to local network (31337) or Sepolia (11155111).`);
    }
  }

  return fhevmInstance;
}

// Get or initialize FHEVM instance
// Note: This function now accepts chainId instead of provider
export async function getFHEVMInstance(chainId?: number): Promise<FhevmInstance> {
  return initializeFHEVM(chainId);
}

/**
 * Encrypt a choice value (0, 1, or 2 for Rock, Scissors, Paper)
 */
export async function encryptChoice(
  fhevm: FhevmInstance,
  contractAddress: string,
  userAddress: string,
  choice: number
): Promise<EncryptedInput> {
  try {
    console.log("[encryptChoice] Starting encryption...", {
      contractAddress,
      userAddress,
      choice,
      fhevmType: fhevm?.constructor?.name
    });

    // Validate inputs
    if (!fhevm) {
      throw new Error("FHEVM instance is null or undefined");
    }
    if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
      throw new Error("Invalid contract address");
    }
    if (!userAddress || userAddress === "0x0000000000000000000000000000000000000000") {
      throw new Error("Invalid user address");
    }
    if (choice < 0 || choice > 2) {
      throw new Error("Choice must be 0 (Rock), 1 (Scissors), or 2 (Paper)");
    }

    console.log("[encryptChoice] Creating encrypted input...");
    const encryptedInput = fhevm
      .createEncryptedInput(contractAddress, userAddress)
      .add32(choice);

    console.log("[encryptChoice] Calling encrypt() - this may trigger MetaMask signature request on Sepolia...");
    console.log("[encryptChoice] Note: On localhost, encrypt() works without signature. On Sepolia, it requires MetaMask signature for input proof");
    
    // On Sepolia, encrypt() will trigger MetaMask signature request
    // On localhost, it should work without signature (pure client-side encryption)
    const encrypted = await encryptedInput.encrypt();

    console.log("[encryptChoice] Encryption successful!", {
      handlesCount: encrypted.handles?.length,
      inputProofLength: encrypted.inputProof?.length
    });

    // Convert Uint8Array to hex strings for contract calls
    const handles = encrypted.handles.map((handle, index) => {
      const hexHandle = ethers.hexlify(handle);
      console.log(`[encryptChoice] Handle ${index}:`, hexHandle.slice(0, 20) + "...");
      
      // Pad to 32 bytes if needed
      if (hexHandle.length < 66) {
        const padded = hexHandle.slice(2).padStart(64, '0');
        return `0x${padded}`;
      }
      if (hexHandle.length > 66) {
        return hexHandle.slice(0, 66);
      }
      return hexHandle;
    });

    const result = {
      handles,
      inputProof: ethers.hexlify(encrypted.inputProof),
    };

    console.log("[encryptChoice] ‚ú?Encryption complete!", {
      handles: result.handles.map(h => h.slice(0, 20) + "..."),
      inputProofLength: result.inputProof.length
    });

    return result;
  } catch (error: any) {
    console.error("[encryptChoice] ‚ù?Encryption failed:", error);
    console.error("[encryptChoice] Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });

    // Provide helpful error messages
    if (error.message?.includes("user rejected") || error.message?.includes("User rejected")) {
      throw new Error("Encryption cancelled: You rejected the MetaMask signature request. Please try again and approve the signature.");
    } else if (error.message?.includes("signature") || error.message?.includes("sign")) {
      throw new Error("Encryption failed: MetaMask signature is required for encryption on Sepolia. Please ensure MetaMask is connected and approve the signature request.");
    } else if (error.message?.includes("network") || error.message?.includes("chain")) {
      throw new Error("Encryption failed: Network error. Please check your MetaMask connection and network settings.");
    } else {
      throw new Error(`Failed to encrypt choice: ${error.message || "Unknown error"}`);
    }
  }
}

/**
 * Batch decrypt multiple handles using Zama standard flow
 * For local network: Uses userDecryptHandleBytes32 from @fhevm/mock-utils
 * For Sepolia: Uses userDecrypt with signature
 */
export async function batchDecrypt(
  fhevm: FhevmInstance,
  handles: { handle: string; contractAddress: string }[],
  userAddress: string,
  signer: any,
  chainId?: number
): Promise<Record<string, number>> {
  console.log("[FHEVM] üîì Batch decrypting", handles.length, "handles...");
  
  if (handles.length === 0) {
    return {};
  }
  
  // Filter out invalid handles
  const validHandles = handles.filter(h => {
    const handleStr = String(h.handle);
    const isValid = handleStr && 
                   handleStr !== "0x" && 
                   handleStr.length === 66 &&
                   handleStr !== "0x0000000000000000000000000000000000000000000000000000000000000000" &&
                   /^0x[0-9a-fA-F]{64}$/.test(handleStr);
    
    if (!isValid) {
      console.warn("[FHEVM] ‚ù?Invalid handle:", handleStr);
    }
    return isValid;
  });
  
  if (validHandles.length === 0) {
    console.error("[FHEVM] ‚ù?NO VALID HANDLES!");
    return {};
  }
  
  console.log("[FHEVM] ‚ú?Valid handles:", validHandles.length);
  
  try {
    const isLocalNetwork = chainId === 31337;
    const isSepoliaNetwork = chainId === 11155111;
    
    if (isLocalNetwork) {
      console.log("[FHEVM] Using userDecryptHandleBytes32 (Mock instance for local network)");
      
      // Ensure userDecryptHandleBytes32 is loaded
      if (!userDecryptHandleBytes32) {
        const mockUtils = await import("@fhevm/mock-utils");
        userDecryptHandleBytes32 = mockUtils.userDecryptHandleBytes32;
      }
      
      if (!userDecryptHandleBytes32) {
        throw new Error("userDecryptHandleBytes32 not available. Please ensure @fhevm/mock-utils is properly initialized.");
      }
      
      // Get provider from localhost
      const provider = new JsonRpcProvider("http://localhost:8545");
      
      console.log("[FHEVM] üîì Decrypting with ACL authorization...");
      
      // Decrypt each handle
      const decrypted: Record<string, number> = {};
      
      for (const h of validHandles) {
        try {
          console.log(`[FHEVM] Decrypting handle: ${h.handle.slice(0, 20)}...`);
          
          const value = await userDecryptHandleBytes32(
            provider,
            signer,
            h.contractAddress,
            h.handle,
            userAddress
          );
          
          decrypted[h.handle] = Number(value);
          console.log(`[FHEVM]   ‚ú?Decrypted: ${value}`);
        } catch (error: any) {
          console.error(`[FHEVM]   ‚ù?Failed to decrypt ${h.handle}:`, error.message);
        }
      }
      
      console.log("[FHEVM] ‚ú?Batch decryption complete!");
      return decrypted;
    } else if (isSepoliaNetwork) {
      // For Sepolia network, use userDecrypt with signature (following crypt-seal-vault pattern)
      console.log("[FHEVM] Using userDecrypt (Sepolia network)");

      // Generate keypair
      const keypair = fhevm.generateKeypair();
      console.log("[FHEVM] ‚ú?Generated keypair");

      // Prepare handle-contract pairs
      const handleContractPairs = validHandles.map(h => ({
        handle: h.handle,
        contractAddress: h.contractAddress,
      }));

      // Get unique contract addresses
      const contractAddresses = [...new Set(validHandles.map(h => h.contractAddress))];

      // Create EIP712 typed data
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = "10";

      const eip712 = fhevm.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimeStamp,
        durationDays
      );

      console.log("[FHEVM] üîë Requesting signature...");

      // Request signature from user
      let signature: string;
      try {
        signature = await signer.signTypedData(
          eip712.domain,
          { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
          eip712.message
        );
      } catch (error: any) {
        // Check for user rejection
        const isUserRejection = 
          error.message?.includes("user rejected") ||
          error.message?.includes("User rejected") ||
          error.message?.includes("ACTION_REJECTED") ||
          error.message?.includes("ethers-user-denied") ||
          error.code === 4001 ||
          error.code === "ACTION_REJECTED" ||
          error.reason === "rejected" ||
          error.info?.error?.code === 4001;
        
        if (isUserRejection) {
          console.log("[FHEVM] User rejected signature request");
          throw new Error("User rejected signature request. Please approve the signature to decrypt the result.");
        }
        throw error;
      }

      console.log("[FHEVM] ‚ú?Got signature, decrypting...");

      // Decrypt with user's signature
      const result = await fhevm.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace("0x", ""),
        contractAddresses,
        userAddress,
        startTimeStamp,
        durationDays
      );

      console.log("[FHEVM] ‚ú?Batch decryption complete!");

      // Convert to numbers
      const decrypted: Record<string, number> = {};
      for (const h of validHandles) {
        if (result[h.handle] !== undefined) {
          decrypted[h.handle] = Number(result[h.handle]);
        }
      }

      return decrypted;
    } else {
      throw new Error(`Unsupported network for decryption. ChainId: ${chainId}. Only local (31337) and Sepolia (11155111) are supported.`);
    }
  } catch (error: any) {
    console.error("[FHEVM] Batch decrypt failed:", error);
    throw error;
  }
}

/**
 * Decrypt euint32 value (single value)
 */
export async function decryptEuint32(
  fhevm: FhevmInstance,
  handle: string,
  contractAddress: string,
  userAddress: string,
  signer: any,
  chainId?: number
): Promise<number> {
  const results = await batchDecrypt(
    fhevm,
    [{ handle, contractAddress }],
    userAddress,
    signer,
    chainId
  );
  return results[handle] || 0;
}

/**
 * Reset FHEVM instance (for network switching)
 */
export function resetFHEVMInstance() {
  fhevmInstance = null;
  // Note: Keep isSDKInitialized = true because SDK only needs to be initialized once
  // Resetting it would cause unnecessary reinitialization
  console.log("[FHEVM] Instance reset");
}

