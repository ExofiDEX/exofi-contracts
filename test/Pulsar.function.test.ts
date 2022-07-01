/* eslint-disable node/no-unpublished-import */
import { config, ethers } from "hardhat";
import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { AdvanceBlock, AdvanceBlockTo, GetBlockNumber, StartAutomine, StopAutomine } from "./helpers";

import { IERC20Burnable, IPulsar } from "../typechain-types";

describe("Pulsar Function Test @skip-on-coverage", () =>
{
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	// if ((config as any).gasReporter.enabled === true) return;

	let TokenFactory: ContractFactory;
	let PulsarFactory: ContractFactory;
	let Signers: SignerWithAddress[];
	let Alice: SignerWithAddress;
	let Bob: SignerWithAddress;
	let Carol: SignerWithAddress;
	let Dave: SignerWithAddress;
	let Elise: SignerWithAddress;
	let Fabian: SignerWithAddress;
	let Gabi: SignerWithAddress;
	let Hank: SignerWithAddress;
	let Ines: SignerWithAddress;
	let Jan: SignerWithAddress;
	let Contract: Contract;

	before(async () =>
	{
		PulsarFactory = await ethers.getContractFactory("Pulsar");
		TokenFactory = await ethers.getContractFactory("ERC20BurnableMock");
		Signers = await ethers.getSigners();
		Alice = Signers[0];
		Bob = Signers[1];
		Carol = Signers[2];
		Dave = Signers[3];
		Elise = Signers[4];
		Fabian = Signers[5];
		Gabi = Signers[6];
		Hank = Signers[7];
		Ines = Signers[8];
		Jan = Signers[9];
	});

	context("Test over lifetime of Pulsar", async () =>
	{
		const Pulsar = () => Contract as IPulsar;
		let startBlockNumber: number;
		let Token: IERC20Burnable;

		beforeEach(async () =>
		{
			const cb = await GetBlockNumber();
			startBlockNumber = cb;
			Token = (await TokenFactory.deploy("MockBurnable", "MBT", 1000000)) as IERC20Burnable;
			await Token.deployed();
			Contract = await PulsarFactory.deploy(cb + 1000, cb + 11000, cb + 12000, Token.address);
			await Contract.deployed();
		});

		it("Pulsar.claim: Claim test 9 benefitaries", async () =>
		{
			// Arrange
			await Token.approve(Pulsar().address, 1000000);
			await Pulsar().loadToken(1000000);
			await Pulsar().addBenefitary(Bob.address);
			await Pulsar().addBenefitary(Carol.address);
			await Pulsar().addBenefitary(Dave.address);
			await Pulsar().addBenefitary(Elise.address);
			await Pulsar().addBenefitary(Fabian.address);
			await Pulsar().addBenefitary(Gabi.address);
			await Pulsar().addBenefitary(Hank.address);
			await Pulsar().addBenefitary(Ines.address);
			await Pulsar().addBenefitary(Jan.address);
			await StopAutomine();

			let blockcount = 0;
			let bob: { claimed: number, pause: number, wait: number } = { claimed: 0, pause: 1, wait: 0 };
			let carol: { claimed: number, pause: number, wait: number } = { claimed: 0, pause: 2, wait: 0 };
			let dave: { claimed: number, pause: number, wait: number } = { claimed: 0, pause: 10, wait: 0 };
			let elise: { claimed: number, pause: number, wait: number } = { claimed: 0, pause: 1000, wait: 0 };
			let fabian: { claimed: number, pause: number, wait: number } = { claimed: 0, pause: 2000, wait: 0 };
			let gabi: { claimed: number, pause: number, wait: number } = { claimed: 0, pause: 3000, wait: 0 };
			let hank: { claimed: number, pause: number, wait: number } = { claimed: 0, pause: 2500, wait: 0 };
			let ines: { claimed: number, pause: number, wait: number } = { claimed: 0, pause: 7000, wait: 0 };
			let jan: { claimed: number, pause: number, wait: number } = { claimed: 0, pause: 11001, wait: 0 };
			// Nothing to claim before the start
			await AdvanceBlockTo(startBlockNumber + 950);
			let start = await GetBlockNumber();
			let until = (startBlockNumber + 1000) - start;
			({ bob, carol, dave, elise, fabian, gabi, hank, ines, jan, blockcount } = await RunClaimTest(0, until, 213, 106, 54, 27, bob, carol, dave, elise, fabian, gabi, hank, ines, jan, blockcount));
			blockcount = 0; // We start blockcount now...
			// Claim for Phase1
			start = await GetBlockNumber();
			until = (startBlockNumber + 3500) - start;
			({ bob, carol, dave, elise, fabian, gabi, hank, ines, jan, blockcount } = await RunClaimTest(1, until, 213, 106, 54, 27, bob, carol, dave, elise, fabian, gabi, hank, ines, jan, blockcount));
			// Claim for Phase2
			start = await GetBlockNumber();
			until = (startBlockNumber + 6000) - start;
			({ bob, carol, dave, elise, fabian, gabi, hank, ines, jan, blockcount } = await RunClaimTest(2, until, 213, 106, 54, 27, bob, carol, dave, elise, fabian, gabi, hank, ines, jan, blockcount));
			// Claim for Phase3
			start = await GetBlockNumber();
			until = (startBlockNumber + 8500) - start;
			({ bob, carol, dave, elise, fabian, gabi, hank, ines, jan, blockcount } = await RunClaimTest(3, until, 213, 106, 54, 27, bob, carol, dave, elise, fabian, gabi, hank, ines, jan, blockcount));
			// Claim for Phase4
			start = await GetBlockNumber();
			until = (startBlockNumber + 11000) - start;
			({ bob, carol, dave, elise, fabian, gabi, hank, ines, jan, blockcount } = await RunClaimTest(4, until, 213, 106, 54, 27, bob, carol, dave, elise, fabian, gabi, hank, ines, jan, blockcount));
			// Nothing to claim for Final
			start = await GetBlockNumber();
			until = (startBlockNumber + 12000) - start;
			({ bob, carol, dave, elise, fabian, gabi, hank, ines, jan, blockcount } = await RunClaimTest(5, until, 213, 106, 54, 27, bob, carol, dave, elise, fabian, gabi, hank, ines, jan, blockcount));
			// After final all has to be 0
			expect(await Pulsar().connect(Alice).getClaimableAmount()).to.equal(0);
			expect(await Pulsar().connect(Bob).getClaimableAmount()).to.equal(0);
			expect(await Pulsar().connect(Carol).getClaimableAmount()).to.equal(0);
			expect(await Pulsar().connect(Dave).getClaimableAmount()).to.equal(0);
			expect(await Pulsar().connect(Elise).getClaimableAmount()).to.equal(0);
			expect(await Pulsar().connect(Fabian).getClaimableAmount()).to.equal(0);
			expect(await Pulsar().connect(Gabi).getClaimableAmount()).to.equal(3000);
			expect(await Pulsar().connect(Hank).getClaimableAmount()).to.equal(0);
			expect(await Pulsar().connect(Ines).getClaimableAmount()).to.equal(10500);
			expect(await Pulsar().connect(Jan).getClaimableAmount()).to.equal(111111);
			await AdvanceBlock();
			expect(await Pulsar().connect(Alice).getClaimableAmount()).to.equal(0);
			expect(await Pulsar().connect(Bob).getClaimableAmount()).to.equal(0);
			expect(await Pulsar().connect(Carol).getClaimableAmount()).to.equal(0);
			expect(await Pulsar().connect(Dave).getClaimableAmount()).to.equal(0);
			expect(await Pulsar().connect(Elise).getClaimableAmount()).to.equal(0);
			expect(await Pulsar().connect(Fabian).getClaimableAmount()).to.equal(0);
			expect(await Pulsar().connect(Gabi).getClaimableAmount()).to.equal(0);
			expect(await Pulsar().connect(Hank).getClaimableAmount()).to.equal(0);
			expect(await Pulsar().connect(Ines).getClaimableAmount()).to.equal(0);
			expect(await Pulsar().connect(Jan).getClaimableAmount()).to.equal(0);
			await StartAutomine();
		});

		async function RunClaimTest(phase: number,
			until: number,
			claimPerBlock1: number,
			claimPerBlock2: number,
			claimPerBlock3: number,
			claimPerBlock4: number,
			bob: { claimed: number, pause: number, wait: number },
			carol: { claimed: number, pause: number, wait: number },
			dave: { claimed: number, pause: number, wait: number },
			elise: { claimed: number, pause: number, wait: number },
			fabian: { claimed: number, pause: number, wait: number },
			gabi: { claimed: number, pause: number, wait: number },
			hank: { claimed: number, pause: number, wait: number },
			ines: { claimed: number, pause: number, wait: number },
			jan: { claimed: number, pause: number, wait: number },
			blockcount: number)
		{
			for (let i = 1; i <= until; ++i)
			{
				let ph1Blocks = 0;
				let ph2Blocks = 0;
				let ph3Blocks = 0;
				let ph4Blocks = 0;
				// All claimable till now.
				if (phase === 1) ph1Blocks = i;
				if (phase === 2)
				{
					ph1Blocks = 2500; ph2Blocks = i;
				}
				if (phase === 3)
				{
					ph1Blocks = 2500; ph2Blocks = 2500; ph3Blocks = i;
				}
				if (phase === 4)
				{
					ph1Blocks = 2500; ph2Blocks = 2500; ph3Blocks = 2500; ph4Blocks = i;
				}
				if (phase > 4)
				{
					ph1Blocks = 2500; ph2Blocks = 2500; ph3Blocks = 2500; ph4Blocks = 2500;
				}

				const claimdecimal = (((ph1Blocks * claimPerBlock1) +
					(ph2Blocks * claimPerBlock2) +
					(ph3Blocks * claimPerBlock3) +
					(ph4Blocks * claimPerBlock4)) / 9);
				const claim = Math.floor(claimdecimal);
				++blockcount;
				({ userClaims: bob } = await UserClaim(blockcount, claim, Bob, bob));
				({ userClaims: carol } = await UserClaim(blockcount, claim, Carol, carol));
				({ userClaims: dave } = await UserClaim(blockcount, claim, Dave, dave));
				({ userClaims: elise } = await UserClaim(blockcount, claim, Elise, elise));
				({ userClaims: fabian } = await UserClaim(blockcount, claim, Fabian, fabian));
				({ userClaims: gabi } = await UserClaim(blockcount, claim, Gabi, gabi));
				({ userClaims: hank } = await UserClaim(blockcount, claim, Hank, hank));
				({ userClaims: ines } = await UserClaim(blockcount, claim, Ines, ines));
				({ userClaims: jan } = await UserClaim(blockcount, claim, Jan, jan));
				console.debug(`Run Phase ${phase} (${i}/${until}/${blockcount}): Expect Bob: ${bob.claimed}, Carol: ${carol.claimed}, Dave: ${dave.claimed}, Elise: ${elise.claimed}, Fabian: ${fabian.claimed}, Gabi: ${gabi.claimed}, Hank: ${hank.claimed}, Ines: ${ines.claimed}, Jan: ${jan.claimed}`);
				await AdvanceBlock();
				expect(await Token.balanceOf(Alice.address)).to.equal(0);
				expect(await Token.balanceOf(Bob.address)).to.equal(bob.claimed);
				expect(await Token.balanceOf(Carol.address)).to.equal(carol.claimed);
				expect(await Token.balanceOf(Dave.address)).to.equal(dave.claimed);
				expect(await Token.balanceOf(Elise.address)).to.equal(elise.claimed);
				expect(await Token.balanceOf(Fabian.address)).to.equal(fabian.claimed);
				expect(await Token.balanceOf(Gabi.address)).to.equal(gabi.claimed);
				expect(await Token.balanceOf(Hank.address)).to.equal(hank.claimed);
				expect(await Token.balanceOf(Ines.address)).to.equal(ines.claimed);
				expect(await Token.balanceOf(Jan.address)).to.equal(jan.claimed);
				expect(await Token.balanceOf(Pulsar().address)).to.equal(1000000 - (bob.claimed + carol.claimed + dave.claimed + elise.claimed + fabian.claimed + gabi.claimed + hank.claimed + ines.claimed + jan.claimed));
			}
			return { bob, carol, dave, elise, fabian, gabi, hank, ines, jan, blockcount };
		}

		async function UserClaim(i: number, claim: number, user: SignerWithAddress, userClaims: { claimed: number, pause: number, wait: number })
		{
			if (i % userClaims.pause === 0)
			{
				await Pulsar().connect(user).claim();
				userClaims.claimed = claim;
			}
			return { userClaims };
		}
	});
});
