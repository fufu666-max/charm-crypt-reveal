
// UI improvements
import { useState, useEffect, useRef, useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import { ethers, BrowserProvider, Contract } from "ethers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { getFHEVMInstance, encryptChoice, decryptEuint32, resetFHEVMInstance } from "@/lib/fhevm";
import { getContractAddress } from "@/lib/contract";
import { Hand, Circle, X, Loader2 } from "lucide-react";
import RockPaperScissorsArtifact from "@/abi/RockPaperScissors.json";
import type { FhevmInstance } from "@zama-fhe/relayer-sdk/bundle";

// Use full ABI from artifact
const CONTRACT_ABI = (RockPaperScissorsArtifact as any).abi;

const CHOICES = [
  { value: 0, label: "Rock", icon: Circle },
  { value: 1, label: "Scissors", icon: X },
  { value: 2, label: "Paper", icon: Hand },
];

const RESULT_LABELS: Record<number, string> = {
  0: "Draw",
  1: "You Win! 🎉",
  2: "System Wins",
};

const RockPaperScissorsGame = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [fhevm, setFhevm] = useState<FhevmInstance | null>(null);
  const [loading, setLoading] = useState(false);
  const [playerChoice, setPlayerChoice] = useState<number | null>(null);
  const [systemChoice, setSystemChoice] = useState<number | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameCount, setGameCount] = useState<bigint>(0n);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [lastDecryptedResult, setLastDecryptedResult] = useState<string | null>(null);
  const [isStartingNewGame, setIsStartingNewGame] = useState(false);
  
  // Refs to track timeouts for cleanup
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  
  // Get contract address based on current chain
  const CONTRACT_ADDRESS = getContractAddress(chainId);
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
    };
  }, []);

  // Initialize FHEVM
  useEffect(() => {
    if (isConnected && chainId) {
      initializeFHEVM();
    } else {
      resetFHEVMInstance();
      setFhevm(null);
    }
  }, [isConnected, chainId]);

  // Decrypt result function - defined before loadGameState to avoid circular dependency
  const decryptResult = useCallback(async (encryptedResult: string) => {
    if (!fhevm || !address || !CONTRACT_ADDRESS || isDecrypting) {
      console.log("[decryptResult] Skipping - already decrypting or missing dependencies");
      return;
    }

    // Prevent concurrent decryption
    if (isDecrypting) {
      console.log("[decryptResult] Already decrypting, skipping...");
      return;
    }

    try {
      setIsDecrypting(true);
      console.log("[decryptResult] Starting decryption...");

      // Get signer from wagmi
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      const decryptedResult = await decryptEuint32(
        fhevm,
        encryptedResult,
        CONTRACT_ADDRESS,
        address,
        signer,
        chainId
      );

      setResult(decryptedResult);
      toast({
        title: "Result Decrypted",
        description: RESULT_LABELS[decryptedResult] || "Unknown result",
      });
    } catch (error: any) {
      console.error("Failed to decrypt result:", error);
      
      // Check for various user rejection patterns
      const isUserRejection = 
        error.message?.includes("user rejected") ||
        error.message?.includes("User rejected") ||
        error.message?.includes("ACTION_REJECTED") ||
        error.message?.includes("ethers-user-denied") ||
        error.code === 4001 ||
        error.code === "ACTION_REJECTED" ||
        error.reason === "rejected" ||
        error.info?.error?.code === 4001;
      
      // Only show error if it's not a user rejection
      if (!isUserRejection) {
        toast({
          title: "Decryption Failed",
          description: error.message || "Failed to decrypt result",
          variant: "destructive",
        });
      } else {
        // User rejected - silently reset state to allow retry
        console.log("[decryptResult] User rejected signature - resetting state for retry");
      }
      
      // Reset last decrypted result on error so we can retry
      setLastDecryptedResult(null);
    } finally {
      setIsDecrypting(false);
    }
  }, [fhevm, address, CONTRACT_ADDRESS, isDecrypting, chainId]);

  // Load game state from contract
  const loadGameState = useCallback(async () => {
    if (!isConnected || !address || !CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      return;
    }

    // Skip ALL state loading if user is starting a new game
    // This prevents overwriting the reset state
    if (isStartingNewGame) {
      console.log("[loadGameState] Skipping - user is starting a new game");
      return;
    }

    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      // Try to get game count separately with error handling
      let gameCountValue = 0n;
      try {
        gameCountValue = await contract.getGameCount(address);
        setGameCount(gameCountValue);
      } catch (error: any) {
        console.warn("[loadGameState] Failed to get game count (may be normal if no games played):", error.message);
        // Continue with default value of 0
        setGameCount(0n);
      }
      
      // Try to get game data separately with error handling
      try {
        const gameData = await contract.getGame(address);
        
        if (gameData && Array.isArray(gameData) && gameData.length >= 4) {
          const [, , encryptedResult, isCompleted] = gameData;
          setGameCompleted(isCompleted as boolean);
          
          // Only decrypt if:
          // 1. Game is completed
          // 2. FHEVM is available
          // 3. Result is not empty
          // 4. Not already decrypting
          // 5. Result handle has changed (new game)
          if (
            isCompleted && 
            fhevm && 
            encryptedResult && 
            encryptedResult !== "0x0000000000000000000000000000000000000000000000000000000000000000" &&
            !isDecrypting &&
            encryptedResult !== lastDecryptedResult
          ) {
            setLastDecryptedResult(encryptedResult as string);
            decryptResult(encryptedResult as string);
          } else if (!isCompleted) {
            // Reset result if game is not completed
            setResult(null);
            setLastDecryptedResult(null);
          }
        }
      } catch (error: any) {
        console.warn("[loadGameState] Failed to get game data (may be normal if no game exists):", error.message);
        // Reset game state if we can't read it
        setGameCompleted(false);
        setResult(null);
        setLastDecryptedResult(null);
      }
    } catch (error: any) {
      console.error("[loadGameState] Failed to load game state:", error);
      // Don't show error toast for view function failures, they're expected if no game exists
    }
  }, [isConnected, address, CONTRACT_ADDRESS, fhevm, isDecrypting, lastDecryptedResult, decryptResult, isStartingNewGame]);

  // Load game state periodically and after transactions
  useEffect(() => {
    if (!isConnected || !address || !CONTRACT_ADDRESS) {
      return;
    }

    // Load immediately
    loadGameState();
    
    // Then poll every 3 seconds
    const interval = setInterval(() => {
      loadGameState();
    }, 3000);
    
    return () => {
      clearInterval(interval);
    };
  }, [loadGameState]);

  const initializeFHEVM = async () => {
    try {
      setLoading(true);
      const instance = await getFHEVMInstance(chainId);
      setFhevm(instance);
      toast({
        title: "FHEVM Initialized",
        description: "Encryption system ready",
      });
    } catch (error: any) {
      console.error("FHEVM initialization failed:", error);
      toast({
        title: "FHEVM Initialization Failed",
        description: error.message || "Please check your network connection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerChoice = async (choice: number) => {
    if (!isConnected || !address || !fhevm || !CONTRACT_ADDRESS) {
      toast({
        title: "Not Ready",
        description: "Please connect your wallet and ensure FHEVM is initialized",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      // Clear the isStartingNewGame flag when user makes a choice
      setIsStartingNewGame(false);
      setPlayerChoice(choice);

      // Encrypt player choice (pure client-side encryption, no network request on localhost)
      const encrypted = await encryptChoice(fhevm, CONTRACT_ADDRESS, address, choice);

      // Submit to contract using ethers
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Validate encrypted data before submission
      if (!encrypted.handles || encrypted.handles.length === 0) {
        throw new Error("Invalid encrypted data: no handles");
      }
      if (!encrypted.inputProof || encrypted.inputProof === "0x") {
        throw new Error("Invalid encrypted data: missing input proof");
      }

      console.log("[handlePlayerChoice] Submitting to contract:", {
        contractAddress: CONTRACT_ADDRESS,
        handle: encrypted.handles[0],
        handleLength: encrypted.handles[0]?.length,
        inputProofLength: encrypted.inputProof?.length,
        chainId: chainId
      });

      toast({
        title: "Submitting Choice",
        description: "Sending encrypted choice to contract...",
      });

      // Use estimateGas first to catch errors early
      try {
        const gasEstimate = await contract.submitChoice.estimateGas(
          encrypted.handles[0], 
          encrypted.inputProof
        );
        console.log("[handlePlayerChoice] Gas estimate:", gasEstimate.toString());
      } catch (estimateError: any) {
        console.error("[handlePlayerChoice] Gas estimation failed:", estimateError);
        throw new Error(`Transaction will fail: ${estimateError.message || "Unknown error"}`);
      }

      const tx = await contract.submitChoice(encrypted.handles[0], encrypted.inputProof);
      toast({
        title: "Transaction Sent",
        description: "Waiting for confirmation...",
      });

      await tx.wait();
      
      toast({
        title: "Choice Submitted",
        description: `Your encrypted choice has been submitted`,
      });

      // Reload game state after a short delay
      const timeoutId = setTimeout(() => {
        loadGameState();
      }, 1000);
      timeoutRefs.current.push(timeoutId);
    } catch (error: any) {
      console.error("Failed to submit choice:", error);
      
      // Provide more helpful error messages
      let errorMessage = error.message || "Failed to submit choice";
      
      if (error.code === "CALL_EXCEPTION" || error.reason?.includes("reverted")) {
        if (error.data === "0x7a47c9a2") {
          errorMessage = "Input verification failed. Please ensure you approved the MetaMask signature request during encryption.";
        } else {
          errorMessage = `Contract call failed: ${error.reason || error.data || "Unknown error"}`;
        }
      } else if (error.message?.includes("user rejected") || error.message?.includes("User rejected")) {
        errorMessage = "You rejected the transaction. Please try again and approve the transaction.";
      } else if (error.message?.includes("signature")) {
        errorMessage = "Signature error. Please ensure you approved the MetaMask signature request during encryption.";
      }
      
      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setPlayerChoice(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSystemChoice = async () => {
    if (!isConnected || !address || !fhevm || !CONTRACT_ADDRESS) {
      toast({
        title: "Not Ready",
        description: "Please connect your wallet and ensure FHEVM is initialized",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Generate random system choice (0, 1, or 2)
      const randomChoice = Math.floor(Math.random() * 3);

      // Encrypt system choice (pure client-side encryption, no network request on localhost)
      const encrypted = await encryptChoice(fhevm, CONTRACT_ADDRESS, address, randomChoice);

      // Submit to contract using ethers
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      toast({
        title: "Submitting System Choice",
        description: "Sending encrypted system choice to contract...",
      });

      const tx = await contract.submitSystemChoice(encrypted.handles[0], encrypted.inputProof);
      toast({
        title: "Transaction Sent",
        description: "Calculating result...",
      });

      await tx.wait();

      toast({
        title: "System Choice Submitted",
        description: "Result calculated! Decrypting...",
      });

      // Reload game state after a short delay
      const timeoutId = setTimeout(() => {
        loadGameState();
      }, 1000);
      timeoutRefs.current.push(timeoutId);
    } catch (error: any) {
      console.error("Failed to submit system choice:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit system choice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startNewGame = () => {
    console.log("[startNewGame] Starting new game - clearing all previous game data");
    
    // Set flag to prevent loadGameState from overwriting reset state
    setIsStartingNewGame(true);
    
    // Reset ALL game state to clear previous game information
    setPlayerChoice(null);
    setSystemChoice(null);
    setResult(null);
    setGameCompleted(false);
    setLastDecryptedResult(null);
    setIsDecrypting(false);
    setLoading(false); // Also reset loading state
    
    // Clear any pending timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = [];
    
    console.log("[startNewGame] All game state cleared. Ready for new game.");
    // The flag will be cleared when user makes a choice in handlePlayerChoice
    // This ensures the UI shows the selection screen immediately
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Rock Paper Scissors</CardTitle>
          <CardDescription>Please connect your wallet to play</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Contract Not Deployed</CardTitle>
          <CardDescription>
            Please deploy the contract first:
            <br />
            <code className="text-xs mt-2 block p-2 bg-muted rounded">
              npx hardhat deploy --network localhost
            </code>
            <br />
            Or set VITE_CONTRACT_ADDRESS in your .env file
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Rock Paper Scissors</CardTitle>
        <CardDescription>
          Privacy-preserving game. Your choice is encrypted and never revealed.
          {gameCount > 0n && ` Games played: ${gameCount.toString()}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!gameCompleted ? (
          <>
            {playerChoice === null ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Choose your move:</h3>
                <div className="grid grid-cols-3 gap-4">
                  {CHOICES.map((choice) => {
                    const Icon = choice.icon;
                    return (
                      <Button
                        key={choice.value}
                        onClick={() => handlePlayerChoice(choice.value)}
                        disabled={loading}
                        variant="outline"
                        className="h-24 flex-col gap-2"
                      >
                        <Icon className="h-8 w-8" />
                        <span>{choice.label}</span>
                      </Button>
                    );
                  })}
                </div>
                {loading && (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-lg">Your choice submitted!</p>
                  <p className="text-sm text-muted-foreground">Waiting for system choice...</p>
                </div>
                <Button
                  onClick={handleSystemChoice}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Submit System Choice"
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4 text-center">
            <div className="text-2xl font-bold">
              {result !== null && RESULT_LABELS[result]}
            </div>
            <div className="text-sm text-muted-foreground">
              {result === 0 && "It's a tie!"}
              {result === 1 && "Congratulations! You won!"}
              {result === 2 && "Better luck next time!"}
            </div>
            <Button onClick={startNewGame} className="w-full">
              Play Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RockPaperScissorsGame;

