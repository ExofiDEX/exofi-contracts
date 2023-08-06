import { config, ethers } from "hardhat";
import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { AdvanceBlock, AdvanceBlockTo, GetBlockNumber, StartAutomine, StopAutomine } from "./helpers";

import { IERC20Burnable, IVortexLock } from "../typechain-types";

describe("VortexLock Function Test @skip-on-coverage", () =>
{
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	if ((config as any).gasReporter.enabled === true) return;

	let TokenFactory: ContractFactory;
	let VortexLockFactory: ContractFactory;
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
		VortexLockFactory = await ethers.getContractFactory("VortexLock");
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

	context("Test over lifetime of VortexLock", async () =>
	{
		const VortexLock = () => Contract as IVortexLock;
		let startBlockNumber: number;
		let Token: IERC20Burnable;

		beforeEach(async () =>
		{
			const cb = await GetBlockNumber();
			startBlockNumber = cb;
			Token = (await TokenFactory.deploy("MockBurnable", "MBT", 1000000)) as IERC20Burnable;
			await Token.deployed();
			Contract = await VortexLockFactory.deploy(cb + 1000, cb + 11000, cb + 12000, Token.address);
			await Contract.deployed();
		});

		it("VortexLock.claim: Claim test 9 benefitaries", async () =>
		{
			// Arrange
			await Token.approve(VortexLock().address, 1000000);
			await VortexLock().loadToken(1000000);
			await VortexLock().addBeneficiary(Bob.address);
			await VortexLock().addBeneficiary(Carol.address);
			await VortexLock().addBeneficiary(Dave.address);
			await VortexLock().addBeneficiary(Elise.address);
			await VortexLock().addBeneficiary(Fabian.address);
			await VortexLock().addBeneficiary(Gabi.address);
			await VortexLock().addBeneficiary(Hank.address);
			await VortexLock().addBeneficiary(Ines.address);
			await VortexLock().addBeneficiary(Jan.address);
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
			expect(await VortexLock().connect(Alice).getClaimableAmount()).to.equal(0);
			expect(await VortexLock().connect(Bob).getClaimableAmount()).to.equal(0);
			expect(await VortexLock().connect(Carol).getClaimableAmount()).to.equal(0);
			expect(await VortexLock().connect(Dave).getClaimableAmount()).to.equal(0);
			expect(await VortexLock().connect(Elise).getClaimableAmount()).to.equal(0);
			expect(await VortexLock().connect(Fabian).getClaimableAmount()).to.equal(0);
			expect(await VortexLock().connect(Gabi).getClaimableAmount()).to.equal(3000);
			expect(await VortexLock().connect(Hank).getClaimableAmount()).to.equal(0);
			expect(await VortexLock().connect(Ines).getClaimableAmount()).to.equal(10500);
			expect(await VortexLock().connect(Jan).getClaimableAmount()).to.equal(111111);
			await AdvanceBlock();
			expect(await VortexLock().connect(Alice).getClaimableAmount()).to.equal(0);
			expect(await VortexLock().connect(Bob).getClaimableAmount()).to.equal(0);
			expect(await VortexLock().connect(Carol).getClaimableAmount()).to.equal(0);
			expect(await VortexLock().connect(Dave).getClaimableAmount()).to.equal(0);
			expect(await VortexLock().connect(Elise).getClaimableAmount()).to.equal(0);
			expect(await VortexLock().connect(Fabian).getClaimableAmount()).to.equal(0);
			expect(await VortexLock().connect(Gabi).getClaimableAmount()).to.equal(0);
			expect(await VortexLock().connect(Hank).getClaimableAmount()).to.equal(0);
			expect(await VortexLock().connect(Ines).getClaimableAmount()).to.equal(0);
			expect(await VortexLock().connect(Jan).getClaimableAmount()).to.equal(0);
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
				expect(await Token.balanceOf(VortexLock().address)).to.equal(1000000 - (bob.claimed + carol.claimed + dave.claimed + elise.claimed + fabian.claimed + gabi.claimed + hank.claimed + ines.claimed + jan.claimed));
			}
			return { bob, carol, dave, elise, fabian, gabi, hank, ines, jan, blockcount };
		}

		async function UserClaim(i: number, claim: number, user: SignerWithAddress, userClaims: { claimed: number, pause: number, wait: number })
		{
			if (i % userClaims.pause === 0)
			{
				await VortexLock().connect(user).claim();
				userClaims.claimed = claim;
			}
			return { userClaims };
		}
	});
});
