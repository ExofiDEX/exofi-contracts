/* eslint-disable node/no-unpublished-import */
import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ADDRESS_ZERO, AdvanceBlock, AdvanceBlockTo, EmitOnlyThis, GetBlockNumber } from "./helpers";

import { IERC20Burnable, IVortexLock } from "../typechain-types";

describe("VortexLock", () =>
{
	let TokenFactory: ContractFactory;
	let VortexLockFactory: ContractFactory;
	let Signers: SignerWithAddress[];
	let Alice: SignerWithAddress;
	let Bob: SignerWithAddress;
	let Carol: SignerWithAddress;
	let Dave: SignerWithAddress;
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
	});

	context("this", async () =>
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

		it("VortexLock.constructor: Should emit OwnershipTransferred event", async () =>
		{
			// Arrange
			// Act
			const result = Contract.deployTransaction;
			// Assert
			await expect(result).to.emit(Contract, "OwnershipTransferred(address,address)").withArgs(ADDRESS_ZERO, Alice.address);
			await EmitOnlyThis(result, Contract, "OwnershipTransferred(address,address)");
		});

		it("VortexLock.loadToken: Should allow owner to load Token with correct allowance", async () =>
		{
			// Arrange
			await Token.approve(VortexLock().address, 1000000);
			// Act
			await VortexLock().loadToken(1000000);
			// Assert
			expect(await Token.allowance(Alice.address, Token.address)).to.equal(0);
			expect(await Token.balanceOf(Alice.address)).to.equal(0);
			expect(await Token.balanceOf(VortexLock().address)).to.equal(1000000);
		});

		it("VortexLock.loadToken: Should not allow owner to load Token after start block", async () =>
		{
			// Arrange
			await Token.approve(VortexLock().address, 1000000);
			await AdvanceBlockTo(startBlockNumber + 1000);
			// Act
			const result = VortexLock().loadToken(1000000);
			// Assert
			await expect(result).to.revertedWith("VortexLock: Can only set before start block");
		});

		it("VortexLock.loadToken: Should not allow owner to load Token without allowance", async () =>
		{
			// Arrange
			// Act
			const result = VortexLock().loadToken(1000000);
			// Assert
			await expect(result).to.revertedWith("VortexLock: Allowance must be equal to amount");
			expect(await Token.allowance(Alice.address, Token.address)).to.equal(0);
			expect(await Token.balanceOf(Alice.address)).to.equal(1000000);
			expect(await Token.balanceOf(VortexLock().address)).to.equal(0);
		});

		it("VortexLock.loadToken: Should not allow owner to load Token with wrong allowance", async () =>
		{
			// Arrange
			await Token.approve(VortexLock().address, 2000000);
			// Act
			const result = VortexLock().loadToken(1000000);
			// Assert
			await expect(result).to.revertedWith("VortexLock: Allowance must be equal to amount");
			expect(await Token.allowance(Alice.address, Token.address)).to.equal(0);
			expect(await Token.balanceOf(Alice.address)).to.equal(1000000);
			expect(await Token.balanceOf(VortexLock().address)).to.equal(0);
		});

		it("VortexLock.loadToken: Should not allow non-owner to load Token", async () =>
		{
			// Arrange
			// Act
			const result = VortexLock().connect(Bob).loadToken(100);
			// Assert
			await expect(result).to.revertedWith("Ownable: caller is not the owner");
		});

		it("VortexLock.addBeneficiary: Should not allow non-owner to add benefitary", async () =>
		{
			// Arrange
			// Act
			const result = VortexLock().connect(Bob).addBeneficiary(Bob.address);
			// Assert
			await expect(result).to.revertedWith("Ownable: caller is not the owner");
		});

		it("VortexLock.addBeneficiary: Should allow owner to add benefitary", async () =>
		{
			// Arrange
			// Act
			await VortexLock().addBeneficiary(Bob.address);
			// Assert
			// No error means all good.
		});

		it("VortexLock.addBeneficiary: Should allow owner to add benefitary after start", async () =>
		{
			// Arrange
			await AdvanceBlockTo(startBlockNumber + 1000);
			// Act
			const result = VortexLock().addBeneficiary(Bob.address);
			// Assert
			await expect(result).to.revertedWith("VortexLock: Can only added before start block");
		});

		it("VortexLock.getClaimableAmount: Should allow sender to see his holdings even if not a benefitary", async () =>
		{
			// Arrange
			await Token.approve(VortexLock().address, 1000000);
			await VortexLock().loadToken(1000000);
			await VortexLock().addBeneficiary(Bob.address);
			await VortexLock().addBeneficiary(Carol.address);
			await VortexLock().addBeneficiary(Dave.address);
			await AdvanceBlockTo(startBlockNumber + 1000);
			// Act
			const holdings = await VortexLock().getClaimableAmount();
			// Assert
			expect(holdings).to.equal(0);
		});

		it("VortexLock.getClaimableAmount: Should allow sender to see his holdings before the start block", async () =>
		{
			// Arrange
			await Token.approve(VortexLock().address, 1000000);
			await VortexLock().loadToken(1000000);
			await VortexLock().addBeneficiary(Bob.address);
			await VortexLock().addBeneficiary(Carol.address);
			await VortexLock().addBeneficiary(Dave.address);
			// Act
			const holdings = await VortexLock().connect(Bob).getClaimableAmount();
			// Assert
			expect(holdings).to.equal(0);
		});

		it("VortexLock.getClaimableAmount: Should allow sender to see his holdings the last time at the final block", async () =>
		{
			// Arrange
			await Token.approve(VortexLock().address, 1000000);
			await VortexLock().loadToken(1000000);
			await VortexLock().addBeneficiary(Bob.address);
			await VortexLock().addBeneficiary(Carol.address);
			await VortexLock().addBeneficiary(Dave.address);
			await AdvanceBlockTo(startBlockNumber + 12000);
			// Act
			const holdings = await VortexLock().connect(Bob).getClaimableAmount();
			// Assert
			expect(holdings).to.equal(333333);
		});

		it("VortexLock.getClaimableAmount: Should allow sender to see that there are no holdings after the final block", async () =>
		{
			// Arrange
			await Token.approve(VortexLock().address, 1000000);
			await VortexLock().loadToken(1000000);
			await VortexLock().addBeneficiary(Bob.address);
			await VortexLock().addBeneficiary(Carol.address);
			await VortexLock().addBeneficiary(Dave.address);
			await AdvanceBlockTo(startBlockNumber + 12000 + 1);
			// Act
			const holdings = await VortexLock().connect(Bob).getClaimableAmount();
			// Assert
			expect(holdings).to.equal(0);
		});

		it("VortexLock.getClaimableAmount: Should allow sender to see his current holdings", async () =>
		{
			// Arrange
			await Token.approve(VortexLock().address, 1000000);
			await VortexLock().loadToken(1000000);
			await VortexLock().addBeneficiary(Bob.address);
			await VortexLock().addBeneficiary(Carol.address);
			await VortexLock().addBeneficiary(Dave.address);
			// Act
			// Start
			await AdvanceBlockTo(startBlockNumber + 1000);
			let holdings = await VortexLock().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(0);
			// 1. Block of Phase 1
			await AdvanceBlock();
			holdings = await VortexLock().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(71);
			// 2. Block os Phase 1
			await AdvanceBlock();
			holdings = await VortexLock().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(142);
			// Last Block of Phase 1
			const maxPhase1Reward = 71 * 2500; // 213/3 = 71 -> No rounding error.
			await AdvanceBlockTo(startBlockNumber + 1000 + 2500);
			holdings = await VortexLock().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(maxPhase1Reward);
			// 1. Block of Phase 2
			await AdvanceBlock();
			holdings = await VortexLock().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(maxPhase1Reward + 35);
			// 2. Block of Phase 2
			await AdvanceBlock();
			holdings = await VortexLock().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(maxPhase1Reward + 70);
			// Last Block of Phase 2
			const maxPhase2Reward = 35 * 2500 + maxPhase1Reward + 833; // 106/3 = 35.3333 -> 0.3333 * 2500 = 833.325
			await AdvanceBlockTo(startBlockNumber + 1000 + 5000);
			holdings = await VortexLock().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(maxPhase2Reward);
			// 1. Block of Phase 3
			await AdvanceBlock();
			holdings = await VortexLock().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(maxPhase2Reward + 18);
			// 2. Block os Phase 3
			await AdvanceBlock();
			holdings = await VortexLock().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(maxPhase2Reward + 36);
			// Last Block of Phase 3
			const maxPhase3Reward = 18 * 2500 + maxPhase2Reward; // 54/3 = 18 -> No rounding error.
			await AdvanceBlockTo(startBlockNumber + 1000 + 7500);
			holdings = await VortexLock().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(maxPhase3Reward);
			// 1. Block of Phase 4
			await AdvanceBlock();
			holdings = await VortexLock().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(maxPhase3Reward + 9);
			// 2. Block os Phase 3
			await AdvanceBlock();
			holdings = await VortexLock().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(maxPhase3Reward + 18);
			// Last Block of Phase 3
			const maxPhase4Reward = 9 * 2500 + maxPhase3Reward; // 27/3 = 9 -> No rounding error.
			await AdvanceBlockTo(startBlockNumber + 1000 + 10000);
			holdings = await VortexLock().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(maxPhase4Reward);
			// Next Block should not change
			await AdvanceBlock();
			holdings = await VortexLock().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(maxPhase4Reward);
		});

		it("VortexLock.die: Should not allow to die before final block", async () =>
		{
			// Arrange
			await Token.approve(VortexLock().address, 1000000);
			await VortexLock().loadToken(1000000);
			await VortexLock().addBeneficiary(Bob.address);
			await VortexLock().addBeneficiary(Carol.address);
			await VortexLock().addBeneficiary(Dave.address);
			await AdvanceBlockTo(startBlockNumber + 12000 - 1);
			// Act
			const result = VortexLock().connect(Bob).die(); // Block +12000
			// Assert
			await expect(result).to.revertedWith("VortexLock: Can only be killed after final block");
		});

		it("VortexLock.die: Should allow to die after final block", async () =>
		{
			// Arrange
			await Token.approve(VortexLock().address, 1000000);
			await VortexLock().loadToken(1000000);
			await VortexLock().addBeneficiary(Bob.address);
			await VortexLock().addBeneficiary(Carol.address);
			await VortexLock().addBeneficiary(Dave.address);
			await AdvanceBlockTo(startBlockNumber + 12000);
			// Act
			await VortexLock().connect(Bob).die(); // Block + 12001
			// Assert
			expect(await Token.balanceOf(VortexLock().address)).to.equal(0);
			expect(await Token.balanceOf(Bob.address)).to.equal(0);
			expect(await Token.balanceOf(Carol.address)).to.equal(0);
			expect(await Token.balanceOf(Dave.address)).to.equal(0);
			expect(await VortexLock().connect(Bob).getClaimableAmount()).to.equal(0);
			expect(await VortexLock().connect(Carol).getClaimableAmount()).to.equal(0);
			expect(await VortexLock().connect(Dave).getClaimableAmount()).to.equal(0);
		});

		it("VortexLock.claim: Should allow sender to claim his holdings", async () =>
		{
			// Arrange
			await Token.approve(VortexLock().address, 1000000);
			await VortexLock().loadToken(1000000);
			await VortexLock().addBeneficiary(Bob.address);
			await VortexLock().addBeneficiary(Carol.address);
			await VortexLock().addBeneficiary(Dave.address);
			await AdvanceBlockTo(startBlockNumber + 11999);
			// Act
			await VortexLock().connect(Bob).claim();
			// Assert
			expect(await Token.balanceOf(Bob.address)).to.equal(333333);
			expect(await Token.balanceOf(VortexLock().address)).to.equal(1000000 - 333333);
		});

		it("VortexLock.claim: Should allow sender to claim his holdings multible times", async () =>
		{
			// Arrange
			await Token.approve(VortexLock().address, 1000000);
			await VortexLock().loadToken(1000000);
			await VortexLock().addBeneficiary(Bob.address);
			await VortexLock().addBeneficiary(Carol.address);
			await VortexLock().addBeneficiary(Dave.address);
			await AdvanceBlockTo(startBlockNumber + 1000);
			// Act
			await VortexLock().connect(Bob).claim();
			expect(await Token.balanceOf(Bob.address)).to.equal(71);
			await AdvanceBlockTo(startBlockNumber + 3499); // End of Phase 1
			await VortexLock().connect(Bob).claim();
			expect(await Token.balanceOf(Bob.address)).to.equal(177500);
			await AdvanceBlockTo(startBlockNumber + 5999); // End of Phase 2
			await VortexLock().connect(Bob).claim();
			expect(await Token.balanceOf(Bob.address)).to.equal(265833);
			await AdvanceBlockTo(startBlockNumber + 8499); // End of Phase 3
			await VortexLock().connect(Bob).claim();
			expect(await Token.balanceOf(Bob.address)).to.equal(310833);
			await AdvanceBlockTo(startBlockNumber + 10999); // End of Phase 4
			await VortexLock().connect(Bob).claim();
			expect(await Token.balanceOf(Bob.address)).to.equal(333333);
			await AdvanceBlockTo(startBlockNumber + 11000);
			// Assert
			expect(await Token.balanceOf(Bob.address)).to.equal(333333);
			expect(await Token.balanceOf(VortexLock().address)).to.equal(1000000 - 333333);
		});

		it("VortexLock.claim: Should not allow non-benefitary to claim", async () =>
		{
			// Arrange
			await Token.approve(VortexLock().address, 1000000);
			await VortexLock().loadToken(1000000);
			await VortexLock().addBeneficiary(Bob.address);
			await VortexLock().addBeneficiary(Carol.address);
			await VortexLock().addBeneficiary(Dave.address);
			await AdvanceBlockTo(startBlockNumber + 11999);
			// Act
			const result = VortexLock().connect(Alice).claim();
			// Assert
			await expect(result).to.revertedWith("VortexLock: Only benefitaries can claim");
		});
	});
});
