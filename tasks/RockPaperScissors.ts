import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * Tutorial: Deploy and Interact Locally (--network localhost)
 * ===========================================================
 *
 * 1. From a separate terminal window:
 *
 *   npx hardhat node
 *
 * 2. Deploy the RockPaperScissors contract
 *
 *   npx hardhat --network localhost deploy
 *
 * 3. Interact with the RockPaperScissors contract
 *
 *   npx hardhat --network localhost task:rps-address
 *   npx hardhat --network localhost task:rps-submit-choice --choice 0
 *   npx hardhat --network localhost task:rps-submit-system-choice --choice 1
 *   npx hardhat --network localhost task:rps-get-result
 *
 *
 * Tutorial: Deploy and Interact on Sepolia (--network sepolia)
 * ===========================================================
 *
 * 1. Deploy the RockPaperScissors contract
 *
 *   npx hardhat --network sepolia deploy
 *
 * 2. Interact with the RockPaperScissors contract
 *
 *   npx hardhat --network sepolia task:rps-address
 *   npx hardhat --network sepolia task:rps-submit-choice --choice 0
 *   npx hardhat --network sepolia task:rps-submit-system-choice --choice 1
 *   npx hardhat --network sepolia task:rps-get-result
 *
 */

/**
 * Example:
 *   - npx hardhat --network localhost task:rps-address
 *   - npx hardhat --network sepolia task:rps-address
 */
task("task:rps-address", "Prints the RockPaperScissors address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;

  const rockPaperScissors = await deployments.get("RockPaperScissors");

  console.log("RockPaperScissors address is " + rockPaperScissors.address);
});

/**
 * Example:
 *   - npx hardhat --network localhost task:rps-submit-choice --choice 0
 *   - npx hardhat --network sepolia task:rps-submit-choice --choice 0
 */
task("task:rps-submit-choice", "Submits player choice to RockPaperScissors Contract")
  .addOptionalParam("address", "Optionally specify the RockPaperScissors contract address")
  .addParam("choice", "The player choice (0=Rock, 1=Scissors, 2=Paper)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const choice = parseInt(taskArguments.choice);
    if (!Number.isInteger(choice) || choice < 0 || choice > 2) {
      throw new Error(`Argument --choice must be 0, 1, or 2`);
    }

    await fhevm.initializeCLIApi();

    const RockPaperScissorsDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("RockPaperScissors");
    console.log(`RockPaperScissors: ${RockPaperScissorsDeployment.address}`);

    const signers = await ethers.getSigners();

    const rockPaperScissorsContract = await ethers.getContractAt("RockPaperScissors", RockPaperScissorsDeployment.address);

    // Encrypt the choice
    const encryptedChoice = await fhevm
      .createEncryptedInput(RockPaperScissorsDeployment.address, signers[0].address)
      .add32(choice)
      .encrypt();

    const tx = await rockPaperScissorsContract
      .connect(signers[0])
      .submitChoice(encryptedChoice.handles[0], encryptedChoice.inputProof);
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    const choiceNames = ["Rock", "Scissors", "Paper"];
    console.log(`RockPaperScissors submitChoice(${choiceNames[choice]}) succeeded!`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:rps-submit-system-choice --choice 1
 *   - npx hardhat --network sepolia task:rps-submit-system-choice --choice 1
 */
task("task:rps-submit-system-choice", "Submits system choice to RockPaperScissors Contract")
  .addOptionalParam("address", "Optionally specify the RockPaperScissors contract address")
  .addParam("choice", "The system choice (0=Rock, 1=Scissors, 2=Paper)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const choice = parseInt(taskArguments.choice);
    if (!Number.isInteger(choice) || choice < 0 || choice > 2) {
      throw new Error(`Argument --choice must be 0, 1, or 2`);
    }

    await fhevm.initializeCLIApi();

    const RockPaperScissorsDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("RockPaperScissors");
    console.log(`RockPaperScissors: ${RockPaperScissorsDeployment.address}`);

    const signers = await ethers.getSigners();

    const rockPaperScissorsContract = await ethers.getContractAt("RockPaperScissors", RockPaperScissorsDeployment.address);

    // Encrypt the choice
    const encryptedChoice = await fhevm
      .createEncryptedInput(RockPaperScissorsDeployment.address, signers[0].address)
      .add32(choice)
      .encrypt();

    const tx = await rockPaperScissorsContract
      .connect(signers[0])
      .submitSystemChoice(encryptedChoice.handles[0], encryptedChoice.inputProof);
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    const choiceNames = ["Rock", "Scissors", "Paper"];
    console.log(`RockPaperScissors submitSystemChoice(${choiceNames[choice]}) succeeded!`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:rps-get-result
 *   - npx hardhat --network sepolia task:rps-get-result
 */
task("task:rps-get-result", "Gets and decrypts the game result")
  .addOptionalParam("address", "Optionally specify the RockPaperScissors contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const RockPaperScissorsDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("RockPaperScissors");
    console.log(`RockPaperScissors: ${RockPaperScissorsDeployment.address}`);

    const signers = await ethers.getSigners();

    const rockPaperScissorsContract = await ethers.getContractAt("RockPaperScissors", RockPaperScissorsDeployment.address);

    const game = await rockPaperScissorsContract.getGame(signers[0].address);
    const [playerChoice, systemChoice, result, isCompleted] = game;

    console.log(`Game completed: ${isCompleted}`);

    if (!isCompleted) {
      console.log("Game is not completed yet. Please submit both choices first.");
      return;
    }

    if (result === ethers.ZeroHash) {
      console.log("Result is not available yet.");
      return;
    }

    const decryptedResult = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      result,
      RockPaperScissorsDeployment.address,
      signers[0],
    );

    const resultLabels: Record<number, string> = {
      0: "Draw",
      1: "Player Wins",
      2: "System Wins",
    };

    console.log(`Encrypted result: ${result}`);
    console.log(`Clear result: ${decryptedResult} (${resultLabels[decryptedResult] || "Unknown"})`);
  });

