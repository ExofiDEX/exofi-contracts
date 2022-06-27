/* eslint-disable node/no-unpublished-import */
import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ADDRESS_ZERO, AdvanceBlock, AdvanceBlockTo, EmitOnlyThis, GetBlockNumber } from "./helpers";

import { IERC20Burnable, IPulsar } from "../typechain-types";

describe("Pulsar", () =>
{
	let TokenFactory: ContractFactory;
	let PulsarFactory: ContractFactory;
	let Signers: SignerWithAddress[];
	let Alice: SignerWithAddress;
	let Bob: SignerWithAddress;
	let Carol: SignerWithAddress;
	let Dave: SignerWithAddress;
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
	});

	context("this", async () =>
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

		it("Pulsar.constructor: Should emit OwnershipTransferred event", async () =>
		{
			// Arrange
			// Act
			const result = Contract.deployTransaction;
			// Assert
			await expect(result).to.emit(Contract, "OwnershipTransferred(address,address)").withArgs(ADDRESS_ZERO, Alice.address);
			await EmitOnlyThis(result, Contract, "OwnershipTransferred(address,address)");
		});

		it("Pulsar.loadToken: Should allow owner to load Token with correct allowance", async () =>
		{
			// Arrange
			await Token.approve(Pulsar().address, 1000000);
			// Act
			await Pulsar().loadToken(1000000);
			// Assert
			expect(await Token.allowance(Alice.address, Token.address)).to.equal(0);
			expect(await Token.balanceOf(Alice.address)).to.equal(0);
			expect(await Token.balanceOf(Pulsar().address)).to.equal(1000000);
		});

		it("Pulsar.loadToken: Should not allow owner to load Token after start block", async () =>
		{
			// Arrange
			await Token.approve(Pulsar().address, 1000000);
			await AdvanceBlockTo(startBlockNumber + 1000);
			// Act
			const result = Pulsar().loadToken(1000000);
			// Assert
			await expect(result).to.revertedWith("Pulsar: Can only set before start block");
		});

		it("Pulsar.loadToken: Should not allow owner to load Token without allowance", async () =>
		{
			// Arrange
			// Act
			const result = Pulsar().loadToken(1000000);
			// Assert
			await expect(result).to.revertedWith("Pulsar: Allowance must be equal to amount");
			expect(await Token.allowance(Alice.address, Token.address)).to.equal(0);
			expect(await Token.balanceOf(Alice.address)).to.equal(1000000);
			expect(await Token.balanceOf(Pulsar().address)).to.equal(0);
		});

		it("Pulsar.loadToken: Should not allow owner to load Token with wrong allowance", async () =>
		{
			// Arrange
			await Token.approve(Pulsar().address, 2000000);
			// Act
			const result = Pulsar().loadToken(1000000);
			// Assert
			await expect(result).to.revertedWith("Pulsar: Allowance must be equal to amount");
			expect(await Token.allowance(Alice.address, Token.address)).to.equal(0);
			expect(await Token.balanceOf(Alice.address)).to.equal(1000000);
			expect(await Token.balanceOf(Pulsar().address)).to.equal(0);
		});

		it("Pulsar.loadToken: Should not allow non-owner to load Token", async () =>
		{
			// Arrange
			// Act
			const result = Pulsar().connect(Bob).loadToken(100);
			// Assert
			await expect(result).to.revertedWith("Ownable: caller is not the owner");
		});

		it("Pulsar.addBenefitary: Should not allow non-owner to add benefitary", async () =>
		{
			// Arrange
			// Act
			const result = Pulsar().connect(Bob).addBenefitary(Bob.address);
			// Assert
			await expect(result).to.revertedWith("Ownable: caller is not the owner");
		});

		it("Pulsar.addBenefitary: Should allow owner to add benefitary", async () =>
		{
			// Arrange
			// Act
			await Pulsar().addBenefitary(Bob.address);
			// Assert
			// No error means all good.
		});

		it("Pulsar.addBenefitary: Should allow owner to add benefitary after start", async () =>
		{
			// Arrange
			await AdvanceBlockTo(startBlockNumber + 1000);
			// Act
			const result = Pulsar().addBenefitary(Bob.address);
			// Assert
			await expect(result).to.revertedWith("Pulsar: Can only added before start block");
		});

		it("Pulsar.getClaimableAmount: Should allow sender to see his holdings even if not a benefitary", async () =>
		{
			// Arrange
			await Token.approve(Pulsar().address, 1000000);
			await Pulsar().loadToken(1000000);
			await Pulsar().addBenefitary(Bob.address);
			await Pulsar().addBenefitary(Carol.address);
			await Pulsar().addBenefitary(Dave.address);
			// Act
			const holdings = await Pulsar().getClaimableAmount();
			// Assert
			expect(holdings).to.equal(0);
		});

		it("Pulsar.getClaimableAmount: Should allow sender to see his holdings before the start block", async () =>
		{
			// Arrange
			await Token.approve(Pulsar().address, 1000000);
			await Pulsar().loadToken(1000000);
			await Pulsar().addBenefitary(Bob.address);
			await Pulsar().addBenefitary(Carol.address);
			await Pulsar().addBenefitary(Dave.address);
			// Act
			const holdings = await Pulsar().connect(Bob).getClaimableAmount();
			// Assert
			expect(holdings).to.equal(0);
		});

		it("Pulsar.getClaimableAmount: Should allow sender to see his holdings the last time at the final block", async () =>
		{
			// Arrange
			await Token.approve(Pulsar().address, 1000000);
			await Pulsar().loadToken(1000000);
			await Pulsar().addBenefitary(Bob.address);
			await Pulsar().addBenefitary(Carol.address);
			await Pulsar().addBenefitary(Dave.address);
			await AdvanceBlockTo(startBlockNumber + 12000);
			// Act
			const holdings = await Pulsar().connect(Bob).getClaimableAmount();
			// Assert
			expect(holdings).to.equal(327500);
		});

		it("Pulsar.getClaimableAmount: Should allow sender to see that there are no holdings after the final block", async () =>
		{
			// Arrange
			await Token.approve(Pulsar().address, 1000000);
			await Pulsar().loadToken(1000000);
			await Pulsar().addBenefitary(Bob.address);
			await Pulsar().addBenefitary(Carol.address);
			await Pulsar().addBenefitary(Dave.address);
			await AdvanceBlockTo(startBlockNumber + 12000 + 1);
			// Act
			const holdings = await Pulsar().connect(Bob).getClaimableAmount();
			// Assert
			expect(holdings).to.equal(0);
		});

		it("Pulsar.getClaimableAmount: Should allow sender to see his current holdings", async () =>
		{
			// Arrange
			await Token.approve(Pulsar().address, 1000000);
			await Pulsar().loadToken(1000000);
			await Pulsar().addBenefitary(Bob.address);
			await Pulsar().addBenefitary(Carol.address);
			await Pulsar().addBenefitary(Dave.address);
			// Act
			// Start
			await AdvanceBlockTo(startBlockNumber + 1000);
			let holdings = await Pulsar().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(0);
			// 1. Block of Phase 1
			await AdvanceBlock();
			holdings = await Pulsar().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(71);
			// 2. Block os Phase 1
			await AdvanceBlock();
			holdings = await Pulsar().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(142);
			// Last Block of Phase 1
			const maxPhase1Reward = 71 * 2500;
			await AdvanceBlockTo(startBlockNumber + 1000 + 2500);
			holdings = await Pulsar().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(maxPhase1Reward);
			// 1. Block of Phase 2
			await AdvanceBlock();
			holdings = await Pulsar().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(maxPhase1Reward + 35);
			// 2. Block os Phase 2
			await AdvanceBlock();
			holdings = await Pulsar().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(maxPhase1Reward + 70);
			// Last Block of Phase 2
			const maxPhase2Reward = 35 * 2500 + maxPhase1Reward;
			await AdvanceBlockTo(startBlockNumber + 1000 + 5000);
			holdings = await Pulsar().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(maxPhase2Reward);
			// 1. Block of Phase 3
			await AdvanceBlock();
			holdings = await Pulsar().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(maxPhase2Reward + 17);
			// 2. Block os Phase 3
			await AdvanceBlock();
			holdings = await Pulsar().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(maxPhase2Reward + 34);
			// Last Block of Phase 3
			const maxPhase3Reward = 17 * 2500 + maxPhase2Reward;
			await AdvanceBlockTo(startBlockNumber + 1000 + 7500);
			holdings = await Pulsar().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(maxPhase3Reward);
			// 1. Block of Phase 4
			await AdvanceBlock();
			holdings = await Pulsar().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(maxPhase3Reward + 8);
			// 2. Block os Phase 3
			await AdvanceBlock();
			holdings = await Pulsar().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(maxPhase3Reward + 16);
			// Last Block of Phase 3
			const maxPhase4Reward = 8 * 2500 + maxPhase3Reward;
			await AdvanceBlockTo(startBlockNumber + 1000 + 10000);
			holdings = await Pulsar().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(maxPhase4Reward);
			// Next Block should not change
			await AdvanceBlock();
			holdings = await Pulsar().connect(Bob).getClaimableAmount();
			expect(holdings).to.equal(maxPhase4Reward);
		});

		it("Pulsar.die: Should not allow to die before final block", async () =>
		{
			// Arrange
			await Token.approve(Pulsar().address, 1000000);
			await Pulsar().loadToken(1000000);
			await Pulsar().addBenefitary(Bob.address);
			await Pulsar().addBenefitary(Carol.address);
			await Pulsar().addBenefitary(Dave.address);
			await AdvanceBlockTo(startBlockNumber + 12000 - 1);
			// Act
			const result = Pulsar().connect(Bob).die(); // Block +12000
			// Assert
			await expect(result).to.revertedWith("Pulsar: Can only be killed after final block");
		});

		it("Pulsar.die: Should allow to die after final block", async () =>
		{
			// Arrange
			await Token.approve(Pulsar().address, 1000000);
			await Pulsar().loadToken(1000000);
			await Pulsar().addBenefitary(Bob.address);
			await Pulsar().addBenefitary(Carol.address);
			await Pulsar().addBenefitary(Dave.address);
			await AdvanceBlockTo(startBlockNumber + 12000);
			// Act
			await Pulsar().connect(Bob).die(); // Block + 12001
			// Assert
			expect(await Token.balanceOf(Pulsar().address)).to.equal(0);
			expect(await Token.balanceOf(Bob.address)).to.equal(0);
			expect(await Token.balanceOf(Carol.address)).to.equal(0);
			expect(await Token.balanceOf(Dave.address)).to.equal(0);
			expect(await Pulsar().connect(Bob).getClaimableAmount()).to.equal(0);
			expect(await Pulsar().connect(Carol).getClaimableAmount()).to.equal(0);
			expect(await Pulsar().connect(Dave).getClaimableAmount()).to.equal(0);
		});

		it("Pulsar.claim: Should allow sender to claim his holdings", async () =>
		{
			// Arrange
			await Token.approve(Pulsar().address, 1000000);
			await Pulsar().loadToken(1000000);
			await Pulsar().addBenefitary(Bob.address);
			await Pulsar().addBenefitary(Carol.address);
			await Pulsar().addBenefitary(Dave.address);
			await AdvanceBlockTo(startBlockNumber + 11999);
			// Act
			await Pulsar().connect(Bob).claim();
			// Assert
			expect(await Token.balanceOf(Bob.address)).to.equal(327500);
			expect(await Token.balanceOf(Pulsar().address)).to.equal(1000000 - 327500);
		});

		it("Pulsar.claim: Should not allow non-benefitary to claim", async () =>
		{
			// Arrange
			await Token.approve(Pulsar().address, 1000000);
			await Pulsar().loadToken(1000000);
			await Pulsar().addBenefitary(Bob.address);
			await Pulsar().addBenefitary(Carol.address);
			await Pulsar().addBenefitary(Dave.address);
			await AdvanceBlockTo(startBlockNumber + 11999);
			// Act
			const result = Pulsar().connect(Alice).claim();
			// Assert
			await expect(result).to.revertedWith("Pulsar: Only benefitaries can claim");
		});
	});
});
