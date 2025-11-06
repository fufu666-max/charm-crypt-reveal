
// Additional test coverage

// Additional test coverage

// Additional test coverage
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { RockPaperScissors, RockPaperScissors__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("RockPaperScissors")) as RockPaperScissors__factory;
  const rockPaperScissorsContract = (await factory.deploy()) as RockPaperScissors;
  const rockPaperScissorsContractAddress = await rockPaperScissorsContract.getAddress();

  return { rockPaperScissorsContract, rockPaperScissorsContractAddress };
}

describe("RockPaperScissors", function () {
  let signers: Signers;
  let rockPaperScissorsContract: RockPaperScissors;
  let rockPaperScissorsContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ rockPaperScissorsContract, rockPaperScissorsContractAddress } = await deployFixture());
  });

  it("should initialize game with player choice", async function () {
    const playerChoice = 0; // Rock
    const encryptedChoice = await fhevm
      .createEncryptedInput(rockPaperScissorsContractAddress, signers.alice.address)
      .add32(playerChoice)
      .encrypt();

    const tx = await rockPaperScissorsContract
      .connect(signers.alice)
      .submitChoice(encryptedChoice.handles[0], encryptedChoice.inputProof);
    await tx.wait();

    const gameCount = await rockPaperScissorsContract.getGameCount(signers.alice.address);
    expect(gameCount).to.eq(1);
  });

  it("should complete game and calculate result - player wins (Rock beats Scissors)", async function () {
    const playerChoice = 0; // Rock
    const systemChoice = 1; // Scissors
    
    // Submit player choice
    const encryptedPlayerChoice = await fhevm
      .createEncryptedInput(rockPaperScissorsContractAddress, signers.alice.address)
      .add32(playerChoice)
      .encrypt();

    let tx = await rockPaperScissorsContract
      .connect(signers.alice)
      .submitChoice(encryptedPlayerChoice.handles[0], encryptedPlayerChoice.inputProof);
    await tx.wait();

    // Submit system choice
    const encryptedSystemChoice = await fhevm
      .createEncryptedInput(rockPaperScissorsContractAddress, signers.alice.address)
      .add32(systemChoice)
      .encrypt();

    tx = await rockPaperScissorsContract
      .connect(signers.alice)
      .submitSystemChoice(encryptedSystemChoice.handles[0], encryptedSystemChoice.inputProof);
    await tx.wait();

    // Get game result
    const game = await rockPaperScissorsContract.getGame(signers.alice.address);
    expect(game.isCompleted).to.be.true;

    // Decrypt result
    const decryptedResult = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      game.result,
      rockPaperScissorsContractAddress,
      signers.alice,
    );
    expect(decryptedResult).to.eq(1); // Player wins
  });

  it("should complete game and calculate result - draw", async function () {
    const playerChoice = 1; // Scissors
    const systemChoice = 1; // Scissors
    
    // Submit player choice
    const encryptedPlayerChoice = await fhevm
      .createEncryptedInput(rockPaperScissorsContractAddress, signers.alice.address)
      .add32(playerChoice)
      .encrypt();

    let tx = await rockPaperScissorsContract
      .connect(signers.alice)
      .submitChoice(encryptedPlayerChoice.handles[0], encryptedPlayerChoice.inputProof);
    await tx.wait();

    // Submit system choice
    const encryptedSystemChoice = await fhevm
      .createEncryptedInput(rockPaperScissorsContractAddress, signers.alice.address)
      .add32(systemChoice)
      .encrypt();

    tx = await rockPaperScissorsContract
      .connect(signers.alice)
      .submitSystemChoice(encryptedSystemChoice.handles[0], encryptedSystemChoice.inputProof);
    await tx.wait();

    // Get game result
    const game = await rockPaperScissorsContract.getGame(signers.alice.address);
    expect(game.isCompleted).to.be.true;

    // Decrypt result
    const decryptedResult = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      game.result,
      rockPaperScissorsContractAddress,
      signers.alice,
    );
    expect(decryptedResult).to.eq(0); // Draw
  });

  it("should complete game and calculate result - system wins (Paper beats Rock)", async function () {
    const playerChoice = 0; // Rock
    const systemChoice = 2; // Paper
    
    // Submit player choice
    const encryptedPlayerChoice = await fhevm
      .createEncryptedInput(rockPaperScissorsContractAddress, signers.alice.address)
      .add32(playerChoice)
      .encrypt();

    let tx = await rockPaperScissorsContract
      .connect(signers.alice)
      .submitChoice(encryptedPlayerChoice.handles[0], encryptedPlayerChoice.inputProof);
    await tx.wait();

    // Submit system choice
    const encryptedSystemChoice = await fhevm
      .createEncryptedInput(rockPaperScissorsContractAddress, signers.alice.address)
      .add32(systemChoice)
      .encrypt();

    tx = await rockPaperScissorsContract
      .connect(signers.alice)
      .submitSystemChoice(encryptedSystemChoice.handles[0], encryptedSystemChoice.inputProof);
    await tx.wait();

    // Get game result
    const game = await rockPaperScissorsContract.getGame(signers.alice.address);
    expect(game.isCompleted).to.be.true;

    // Decrypt result
    const decryptedResult = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      game.result,
      rockPaperScissorsContractAddress,
      signers.alice,
    );
    expect(decryptedResult).to.eq(2); // System wins
  });

  it("should test all win conditions", async function () {
    const testCases = [
      { player: 0, system: 1, expected: 1 }, // Rock beats Scissors
      { player: 1, system: 2, expected: 1 }, // Scissors beats Paper
      { player: 2, system: 0, expected: 1 }, // Paper beats Rock
      { player: 0, system: 0, expected: 0 }, // Draw
      { player: 1, system: 1, expected: 0 }, // Draw
      { player: 2, system: 2, expected: 0 }, // Draw
      { player: 0, system: 2, expected: 2 }, // Paper beats Rock (system wins)
      { player: 1, system: 0, expected: 2 }, // Rock beats Scissors (system wins)
      { player: 2, system: 1, expected: 2 }, // Scissors beats Paper (system wins)
    ];

    for (const testCase of testCases) {
      // Submit player choice
      const encryptedPlayerChoice = await fhevm
        .createEncryptedInput(rockPaperScissorsContractAddress, signers.bob.address)
        .add32(testCase.player)
        .encrypt();

      let tx = await rockPaperScissorsContract
        .connect(signers.bob)
        .submitChoice(encryptedPlayerChoice.handles[0], encryptedPlayerChoice.inputProof);
      await tx.wait();

      // Submit system choice
      const encryptedSystemChoice = await fhevm
        .createEncryptedInput(rockPaperScissorsContractAddress, signers.bob.address)
        .add32(testCase.system)
        .encrypt();

      tx = await rockPaperScissorsContract
        .connect(signers.bob)
        .submitSystemChoice(encryptedSystemChoice.handles[0], encryptedSystemChoice.inputProof);
      await tx.wait();

      // Get game result
      const game = await rockPaperScissorsContract.getGame(signers.bob.address);
      expect(game.isCompleted).to.be.true;

      // Decrypt result
      const decryptedResult = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        game.result,
        rockPaperScissorsContractAddress,
        signers.bob,
      );
      expect(decryptedResult).to.eq(testCase.expected);
    }
  });
});

