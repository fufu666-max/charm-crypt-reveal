import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { RockPaperScissors } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("RockPaperScissorsSepolia", function () {
  let signers: Signers;
  let rockPaperScissorsContract: RockPaperScissors;
  let rockPaperScissorsContractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const RockPaperScissorsDeployment = await deployments.get("RockPaperScissors");
      rockPaperScissorsContractAddress = RockPaperScissorsDeployment.address;
      rockPaperScissorsContract = await ethers.getContractAt("RockPaperScissors", RockPaperScissorsDeployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("should complete a full game on Sepolia", async function () {
    steps = 15;
    this.timeout(4 * 40000);

    const playerChoice = 0; // Rock
    const systemChoice = 1; // Scissors

    progress("Encrypting player choice (Rock = 0)...");
    const encryptedPlayerChoice = await fhevm
      .createEncryptedInput(rockPaperScissorsContractAddress, signers.alice.address)
      .add32(playerChoice)
      .encrypt();

    progress(
      `Call submitChoice() RockPaperScissors=${rockPaperScissorsContractAddress} handle=${ethers.hexlify(encryptedPlayerChoice.handles[0])} signer=${signers.alice.address}...`,
    );
    let tx = await rockPaperScissorsContract
      .connect(signers.alice)
      .submitChoice(encryptedPlayerChoice.handles[0], encryptedPlayerChoice.inputProof);
    await tx.wait();

    progress("Encrypting system choice (Scissors = 1)...");
    const encryptedSystemChoice = await fhevm
      .createEncryptedInput(rockPaperScissorsContractAddress, signers.alice.address)
      .add32(systemChoice)
      .encrypt();

    progress(
      `Call submitSystemChoice() RockPaperScissors=${rockPaperScissorsContractAddress} handle=${ethers.hexlify(encryptedSystemChoice.handles[0])} signer=${signers.alice.address}...`,
    );
    tx = await rockPaperScissorsContract
      .connect(signers.alice)
      .submitSystemChoice(encryptedSystemChoice.handles[0], encryptedSystemChoice.inputProof);
    await tx.wait();

    progress(`Call getGame()...`);
    const game = await rockPaperScissorsContract.getGame(signers.alice.address);
    expect(game.isCompleted).to.be.true;

    progress(`Decrypting result=${game.result}...`);
    const decryptedResult = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      game.result,
      rockPaperScissorsContractAddress,
      signers.alice,
    );
    progress(`Clear result=${decryptedResult} (1 = Player Wins)`);

    expect(decryptedResult).to.eq(1); // Player wins (Rock beats Scissors)
  });
});

