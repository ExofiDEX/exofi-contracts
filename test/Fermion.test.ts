/* eslint-disable node/no-unpublished-import */
import { ethers } from "hardhat";
import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ADDRESS_ZERO, AdvanceBlock, EmitOnlyThis, StartAutomine, StopAutomine } from "./helpers";

import { IERC20, IERC20AltApprove, IERC20Burnable, IERC20Metadata, IFermion, IOwnable } from "../typechain-types";

describe("Fermion", () =>
{
	let FermionFactory: ContractFactory;
	let Signers: SignerWithAddress[];
	let Alice: SignerWithAddress;
	let Bob: SignerWithAddress;
	let Carol: SignerWithAddress;
	let Contract: Contract;

	before(async () =>
	{
		FermionFactory = await ethers.getContractFactory("Fermion");
		Signers = await ethers.getSigners();
		Alice = Signers[0];
		Bob = Signers[1];
		Carol = Signers[2];
	});

	context("this", async () =>
	{
		const Fermion = () => Contract as IFermion;
		// Should only be used in Arrange and Assert. The need to use this in Act points to a flaw in the interface structure.
		const TestOnlyERC20 = () => Contract as IERC20;

		beforeEach(async () =>
		{
			Contract = await FermionFactory.deploy();
			await Contract.deployed();
		});

		it("Fermion.constructor: Should emit OwnershipTransferred event", async () =>
		{
			// Act
			const result = Contract.deployTransaction;
			// Assert
			await expect(result).to.emit(Contract, "OwnershipTransferred(address,address)").withArgs(ADDRESS_ZERO, Alice.address);
			await EmitOnlyThis(result, Contract, "OwnershipTransferred(address,address)");
		});

		it("Fermion.mint: Should allow owner to mint", async () =>
		{
			// Arrange
			// Act
			const result = await Fermion().mint(Bob.address, 100);

			// Assert
			await expect(result).to.emit(Contract, "Transfer(address,address,uint256)").withArgs(ADDRESS_ZERO, Bob.address, 100);
			await EmitOnlyThis(result, Contract, "Transfer(address,address,uint256)");
			expect(await TestOnlyERC20().totalSupply()).to.equal(100);
			expect(await TestOnlyERC20().balanceOf(Bob.address)).to.equal(100);
		});

		it("Fermion.mint: Should not allow non-owner to mint", async () =>
		{
			// Arrange
			// Act
			const result = Fermion().connect(Bob).mint(Bob.address, 100);

			// Assert
			await expect(result).to.revertedWith("Ownable: caller is not the owner");
			expect(await TestOnlyERC20().totalSupply()).to.equal(0);
			expect(await TestOnlyERC20().balanceOf(Bob.address)).to.equal(0);
		});
	});

	context("IERC20Burnable", async () =>
	{
		const ERC20Burnable = () => Contract as IERC20Burnable;

		// Should only be used in Arrange and Assert. The need to use this in Act points to a flaw in the interface structure.
		const TestOnlyERC20 = () => Contract as IERC20;
		const TestOnlyFermion = () => Contract as IFermion;

		beforeEach(async () =>
		{
			Contract = await FermionFactory.deploy();
			await Contract.deployed();
		});

		it("Fermion.burn: Should emit `Transfer` event", async () =>
		{
			// Arrange
			await TestOnlyFermion().mint(Alice.address, 100);
			// Act
			const result = await ERC20Burnable().burn(50);
			// Assert
			await expect(result).to.emit(Contract, "Transfer(address,address,uint256)").withArgs(Alice.address, ADDRESS_ZERO, 50);
			await EmitOnlyThis(result, Contract, "Transfer(address,address,uint256)");
		});

		it("Fermion.burn: Should allow token holder to burn all of his tokens", async () =>
		{
			// Arrange
			await TestOnlyFermion().mint(Alice.address, 100);
			await TestOnlyFermion().mint(Bob.address, 100);
			// Act
			const result = await ERC20Burnable().burn(100);
			// Assert
			await expect(result).to.emit(Contract, "Transfer(address,address,uint256)").withArgs(Alice.address, ADDRESS_ZERO, 100);
			await EmitOnlyThis(result, Contract, "Transfer(address,address,uint256)");
			expect(await TestOnlyERC20().totalSupply()).to.equal(100);
			expect(await TestOnlyERC20().balanceOf(Alice.address)).to.equal(0);
			expect(await TestOnlyERC20().balanceOf(Bob.address)).to.equal(100);
		});

		it("Fermion.burn: Should allow token holder to burn part of his tokens", async () =>
		{
			// Arrange
			await TestOnlyFermion().mint(Alice.address, 100);
			await TestOnlyFermion().mint(Bob.address, 100);
			// Act
			const result = await ERC20Burnable().burn(50);
			// Assert
			await expect(result).to.emit(Contract, "Transfer(address,address,uint256)").withArgs(Alice.address, ADDRESS_ZERO, 50);
			await EmitOnlyThis(result, Contract, "Transfer(address,address,uint256)");
			expect(await TestOnlyERC20().totalSupply()).to.equal(150);
			expect(await TestOnlyERC20().balanceOf(Alice.address)).to.equal(50);
			expect(await TestOnlyERC20().balanceOf(Bob.address)).to.equal(100);
		});

		it("Fermion.burn: Should not allow token holder to burn more than his tokens", async () =>
		{
			// Arrange
			await TestOnlyFermion().mint(Alice.address, 100);
			await TestOnlyFermion().mint(Bob.address, 100);
			// Act
			const result = ERC20Burnable().burn(101);
			// Assert
			await expect(result).to.be.revertedWith("ERC20: burn exceeds balance");
			expect(await TestOnlyERC20().totalSupply()).to.equal(200);
			expect(await TestOnlyERC20().balanceOf(Alice.address)).to.equal(100);
			expect(await TestOnlyERC20().balanceOf(Bob.address)).to.equal(100);
		});

		it("Fermion.burnFrom: Should emit `Transfer` and `Approval` event", async () =>
		{
			// Arrange
			await TestOnlyFermion().mint(Alice.address, 100);
			await TestOnlyFermion().mint(Bob.address, 100);
			await TestOnlyERC20().connect(Bob).approve(Alice.address, 50);
			// Act
			const result = await ERC20Burnable().burnFrom(Bob.address, 20);
			// Assert
			await expect(result).to.emit(Contract, "Transfer(address,address,uint256)").withArgs(Bob.address, ADDRESS_ZERO, 20);
			await expect(result).to.emit(Contract, "Approval(address, address, uint256)").withArgs(Bob.address, Alice.address, 30);
			await EmitOnlyThis(result, Contract, "Transfer(address,address,uint256)", "Approval(address,address,uint256)");
		});

		it("Fermion.burnFrom: Should allow token holder to burn part of the tokens he got allowance for", async () =>
		{
			// Arrange
			await TestOnlyFermion().mint(Alice.address, 100);
			await TestOnlyFermion().mint(Bob.address, 100);
			await TestOnlyERC20().connect(Bob).approve(Alice.address, 50);
			// Act
			const result = await ERC20Burnable().burnFrom(Bob.address, 25);
			// Assert
			await expect(result).to.emit(Contract, "Transfer(address,address,uint256)").withArgs(Bob.address, ADDRESS_ZERO, 25);
			await expect(result).to.emit(Contract, "Approval(address, address, uint256)").withArgs(Bob.address, Alice.address, 25);
			await EmitOnlyThis(result, Contract, "Transfer(address,address,uint256)", "Approval(address,address,uint256)");
			expect(await TestOnlyERC20().totalSupply()).to.equal(175);
			expect(await TestOnlyERC20().balanceOf(Alice.address)).to.equal(100);
			expect(await TestOnlyERC20().balanceOf(Bob.address)).to.equal(75);
			expect(await TestOnlyERC20().allowance(Bob.address, Alice.address)).to.equal(25);
		});

		it("Fermion.burnFrom: Should allow token holder to burn all of the tokens he got allowance for", async () =>
		{
			// Arrange
			await TestOnlyFermion().mint(Alice.address, 100);
			await TestOnlyFermion().mint(Bob.address, 100);
			await TestOnlyERC20().connect(Bob).approve(Alice.address, 50);
			// Act
			const result = await ERC20Burnable().burnFrom(Bob.address, 50);
			// Assert
			await expect(result).to.emit(Contract, "Transfer(address,address,uint256)").withArgs(Bob.address, ADDRESS_ZERO, 50);
			await expect(result).to.emit(Contract, "Approval(address, address, uint256)").withArgs(Bob.address, Alice.address, 0);
			await EmitOnlyThis(result, Contract, "Transfer(address,address,uint256)", "Approval(address,address,uint256)");
			expect(await TestOnlyERC20().totalSupply()).to.equal(150);
			expect(await TestOnlyERC20().balanceOf(Alice.address)).to.equal(100);
			expect(await TestOnlyERC20().balanceOf(Bob.address)).to.equal(50);
			expect(await TestOnlyERC20().allowance(Bob.address, Alice.address)).to.equal(0);
		});

		it("Fermion.burnFrom: Should not allow token holder to burn more tokens he got allowance for", async () =>
		{
			// Arrange
			await TestOnlyFermion().mint(Alice.address, 100);
			await TestOnlyFermion().mint(Bob.address, 100);
			await TestOnlyERC20().connect(Bob).approve(Alice.address, 50);
			// Act
			const result = ERC20Burnable().burnFrom(Bob.address, 51);
			// Assert
			await expect(result).to.be.revertedWith("ERC20: insufficient allowance");
			expect(await TestOnlyERC20().totalSupply()).to.equal(200);
			expect(await TestOnlyERC20().balanceOf(Alice.address)).to.equal(100);
			expect(await TestOnlyERC20().balanceOf(Bob.address)).to.equal(100);
			expect(await TestOnlyERC20().allowance(Bob.address, Alice.address)).to.equal(50);
		});

		it("Fermion._mint: Should allow to mint.", async () =>
		{
			// NOTICE: _mint is only used in the mock contract for testing purposes.
			// The purpose for this test is to proof that mockMint used in other test cases is working as expected.
			// Arrange
			// Act
			const result = await TestOnlyFermion().mint(Alice.address, 25);
			// Assert
			await expect(result).to.emit(Contract, "Transfer(address,address,uint256)").withArgs(ADDRESS_ZERO, Alice.address, 25);
			await EmitOnlyThis(result, Contract, "Transfer(address,address,uint256)");
			expect(await TestOnlyERC20().totalSupply()).to.equal(25);
			expect(await TestOnlyERC20().balanceOf(Alice.address)).to.equal(25);
		});
	});

	context("IERC20", async () =>
	{
		const ERC20 = () => Contract as IERC20;

		// Should only be used in Arrange and Assert. The need to use this in Act points to a flaw in the interface structure.
		const TestOnlyFermion = () => Contract as IFermion;

		beforeEach(async () =>
		{
			Contract = await FermionFactory.deploy();
			await Contract.deployed();
		});

		it("Fermion.approve: Should emit `Approval` event", async () =>
		{
			// Arrange
			await TestOnlyFermion().mint(Alice.address, 100);
			// Act
			const result = await ERC20().approve(Bob.address, 10);
			// Assert
			await expect(result).to.emit(Contract, "Approval(address,address,uint256)").withArgs(Alice.address, Bob.address, 10);
			await EmitOnlyThis(result, Contract, "Approval(address,address,uint256)");
		});

		it("Fermion.approve: Should allow set of approval", async () =>
		{
			// Arrange
			await TestOnlyFermion().mint(Alice.address, 100);
			// Act
			const result = await ERC20().approve(Bob.address, 10);
			// Assert
			const approved = await ERC20().allowance(Alice.address, Bob.address);
			expect(approved.toString()).to.equal("10");
			await expect(result).to.emit(Contract, "Approval(address,address,uint256)").withArgs(Alice.address, Bob.address, 10);
			await EmitOnlyThis(result, Contract, "Approval(address,address,uint256)");
		});

		it("Fermion.approve: Proof of unfixable approve/transferFrom attack vector", async () =>
		{
			await TestOnlyFermion().mint(Alice.address, 100);
			await ERC20().approve(Bob.address, 50);
			await StopAutomine();
			// What happens is that Alice is changing the approved tokens from 50 to 30.
			// Bob notice this before the Transaction of Alice is confirmed and added his on transferFrom transaction.
			// The attack is successfull if the transferFrom transaction is confirmed before the approve transaction or
			// if confirmed in the same block the transferFrom transaction is processed first.
			// We simulate that second case.
			await ERC20().connect(Bob).transferFrom(Alice.address, Bob.address, 50);
			await ERC20().approve(Bob.address, 30);
			await AdvanceBlock();
			// The Damange is now done. There is no way to prevent this inside the approve method.
			await StartAutomine();
			await ERC20().connect(Bob).transferFrom(Alice.address, Bob.address, 30);

			expect(await ERC20().balanceOf(Alice.address)).to.equal(20);
			expect(await ERC20().balanceOf(Bob.address)).to.equal(80);
		});

		it("Fermion.balanceOf: Should allow to get balance of tokens.", async () =>
		{
			// Arrange
			await TestOnlyFermion().mint(Alice.address, 25);
			await TestOnlyFermion().mint(Bob.address, 50);
			// Act
			const resultAlice = await ERC20().balanceOf(Alice.address);
			const resultBob = await ERC20().balanceOf(Bob.address);
			// Assert
			expect(resultAlice).to.equal(25);
			expect(resultBob).to.equal(50);
		});

		it("Fermion.totalSupply: Should allow to get total token supply.", async () =>
		{
			// Arrange
			await TestOnlyFermion().mint(Alice.address, 25);
			await TestOnlyFermion().mint(Bob.address, 25);
			// Act
			const result = await ERC20().totalSupply();
			// Assert
			expect(result).to.equal(50);
		});

		it("Fermion.transfer: Should emit `Transfer` event", async () =>
		{
			// Arrange
			await TestOnlyFermion().mint(Alice.address, "100");
			// Act
			const result = await ERC20().transfer(Carol.address, "10");
			// Assert
			await expect(result).to.emit(Contract, "Transfer(address,address,uint256)").withArgs(Alice.address, Carol.address, 10);
			await EmitOnlyThis(result, Contract, "Transfer(address,address,uint256)");
		});

		it("Fermion.transfer: Should allow token transfer", async () =>
		{
			// Arrange
			await TestOnlyFermion().mint(Alice.address, "100");
			// Act
			const result = await ERC20().transfer(Carol.address, "10");
			// Assert
			const totalSupply = await ERC20().totalSupply();
			const aliceBal = await ERC20().balanceOf(Alice.address);
			const carolBal = await ERC20().balanceOf(Carol.address);
			expect(totalSupply.toString()).to.equal("100");
			expect(aliceBal.toString()).to.equal("90");
			expect(carolBal.toString()).to.equal("10");
			await EmitOnlyThis(result, Contract, "Transfer(address,address,uint256)");
		});

		it("Fermion.transfer: Should not allow transfer more than balance", async () =>
		{
			// Arrange
			await TestOnlyFermion().mint(Alice.address, "100");
			// Act
			const result = ERC20().transfer(Carol.address, "110");
			// Assert
			await expect(result).to.be.revertedWith("ERC20: transfer exceeds balance");
			const aliceBal = await ERC20().balanceOf(Alice.address);
			const carolBal = await ERC20().balanceOf(Carol.address);
			expect(aliceBal.toString()).to.equal("100");
			expect(carolBal.toString()).to.equal("0");
		});

		it("Fermion.transferFrom: Should emit `Transfer` and `Approval` event", async () =>
		{
			// Arrange
			await TestOnlyFermion().mint(Alice.address, 100);
			await ERC20().approve(Bob.address, 50);
			// Act
			const result = await ERC20().connect(Bob).transferFrom(Alice.address, Carol.address, 10);
			// Assert
			await expect(result).to.emit(Contract, "Approval(address,address,uint256)").withArgs(Alice.address, Bob.address, 40);
			await expect(result).to.emit(Contract, "Transfer(address,address,uint256)").withArgs(Alice.address, Carol.address, 10);
			await EmitOnlyThis(result, Contract, "Approval(address,address,uint256)", "Transfer(address,address,uint256)");
		});

		it("Fermion.transferFrom: Should allow token transfer and reduce allowance", async () =>
		{
			// Arrange
			await TestOnlyFermion().mint(Alice.address, "100");
			await ERC20().approve(Bob.address, 50);
			// Act
			const result = await ERC20().connect(Bob).transferFrom(Alice.address, Carol.address, 10);
			// Assert
			const totalSupply = await ERC20().totalSupply();
			const aliceBal = await ERC20().balanceOf(Alice.address);
			const carolBal = await ERC20().balanceOf(Carol.address);
			const allowance = await ERC20().allowance(Alice.address, Bob.address);
			expect(totalSupply.toString()).to.equal("100");
			expect(aliceBal.toString()).to.equal("90");
			expect(carolBal.toString()).to.equal("10");
			expect(allowance.toString()).to.equal("40");
			await expect(result).to.emit(Contract, "Approval(address,address,uint256)").withArgs(Alice.address, Bob.address, 40);
			await expect(result).to.emit(Contract, "Transfer(address,address,uint256)").withArgs(Alice.address, Carol.address, 10);
			await EmitOnlyThis(result, Contract, "Approval(address,address,uint256)", "Transfer(address,address,uint256)");
		});

		it("Fermion.transferFrom: Should allow token transfer and not reduce infinite allowance", async () =>
		{
			// Arrange
			const max: BigNumber = BigNumber.from(2).pow(256).sub(1);
			await TestOnlyFermion().mint(Alice.address, "100");
			await ERC20().approve(Bob.address, max);
			// Act
			const result = await ERC20().connect(Bob).transferFrom(Alice.address, Carol.address, 10);
			// Assert
			const totalSupply = await ERC20().totalSupply();
			const aliceBal = await ERC20().balanceOf(Alice.address);
			const carolBal = await ERC20().balanceOf(Carol.address);
			const allowance = await ERC20().allowance(Alice.address, Bob.address);
			expect(totalSupply.toString()).to.equal("100");
			expect(aliceBal.toString()).to.equal("90");
			expect(carolBal.toString()).to.equal("10");
			expect(allowance).to.equal(max);
			await expect(result).to.emit(Contract, "Transfer(address,address,uint256)").withArgs(Alice.address, Carol.address, 10);
			await EmitOnlyThis(result, Contract, "Transfer(address,address,uint256)");
		});

		it("Fermion.transferFrom: Should not allow transfer more than balance", async () =>
		{
			// Arrange
			await TestOnlyFermion().mint(Alice.address, "100");
			await ERC20().approve(Bob.address, 200);
			// Act
			const result = ERC20().connect(Bob).transferFrom(Alice.address, Carol.address, 110);
			// Assert
			await expect(result).to.be.revertedWith("ERC20: transfer exceeds balance");
			const aliceBal = await ERC20().balanceOf(Alice.address);
			const carolBal = await ERC20().balanceOf(Carol.address);
			const allowance = await ERC20().allowance(Alice.address, Bob.address);
			expect(aliceBal.toString()).to.equal("100");
			expect(carolBal.toString()).to.equal("0");
			expect(allowance.toString()).to.equal("200");
		});

		it("Fermion.transferFrom: Should not allow transfer more than allowance", async () =>
		{
			// Arrange
			await TestOnlyFermion().mint(Alice.address, 100);
			await ERC20().approve(Bob.address, 90);
			// Act
			const result = ERC20().connect(Bob).transferFrom(Alice.address, Carol.address, 100);
			// Assert
			await expect(result).to.be.revertedWith("ERC20: insufficient allowance");
			const aliceBal = await ERC20().balanceOf(Alice.address);
			const carolBal = await ERC20().balanceOf(Carol.address);
			const allowance = await ERC20().allowance(Alice.address, Bob.address);
			expect(aliceBal.toString()).to.equal("100");
			expect(carolBal.toString()).to.equal("0");
			expect(allowance.toString()).to.equal("90");
		});
	});

	context("IERC20AltApprove", async () =>
	{
		const ERC20AltApprove = () => Contract as IERC20AltApprove;
		const TestOnlyERC20 = () => Contract as IERC20;
		const TestOnlyFermion = () => Contract as IFermion;

		beforeEach(async () =>
		{
			Contract = await FermionFactory.deploy();
			await Contract.deployed();
		});

		it("Fermion.decreaseAllowance: Should allow token holder to change allowance", async () =>
		{
			// Arrange
			await TestOnlyFermion().mint(Alice.address, "100");
			await ERC20AltApprove().increaseAllowance(Bob.address, 100);
			// Act
			const result = await ERC20AltApprove().decreaseAllowance(Bob.address, 50);
			// Assert
			await EmitOnlyThis(result, Contract, "Approval(address,address,uint256)");
			expect(await TestOnlyERC20().allowance(Alice.address, Bob.address)).to.equal(50);
		});

		it("Fermion.decreaseAllowance: Should allow token holder to change allowance multible times", async () =>
		{
			// Arrange
			await TestOnlyFermion().mint(Alice.address, "100");
			await ERC20AltApprove().increaseAllowance(Bob.address, 100);
			// Act
			await ERC20AltApprove().decreaseAllowance(Bob.address, 50);
			await ERC20AltApprove().decreaseAllowance(Bob.address, 10);
			await ERC20AltApprove().decreaseAllowance(Bob.address, 20);
			// Assert
			expect(await TestOnlyERC20().allowance(Alice.address, Bob.address)).to.equal(20);
		});

		it("Fermion.decreaseAllowance: Should not allow token holder to change allowance below 0", async () =>
		{
			// Arrange
			await TestOnlyFermion().mint(Alice.address, "100");
			await ERC20AltApprove().increaseAllowance(Bob.address, 100);
			// Act
			const result = ERC20AltApprove().decreaseAllowance(Bob.address, 101);
			// Assert
			await expect(result).to.revertedWith("ERC20: reduced allowance below 0");
			expect(await TestOnlyERC20().allowance(Alice.address, Bob.address)).to.equal(100);
		});

		it("Fermion.increaseAllowance: Should allow token holder to change allowance", async () =>
		{
			// Arrange
			await TestOnlyFermion().mint(Alice.address, "100");
			// Act
			const result = await ERC20AltApprove().increaseAllowance(Bob.address, 50);
			// Assert
			await EmitOnlyThis(result, Contract, "Approval(address,address,uint256)");
			expect(await TestOnlyERC20().allowance(Alice.address, Bob.address)).to.equal(50);
		});

		it("Fermion.increaseAllowance: Should allow token holder to change allowance above hold tokens", async () =>
		{
			// Arrange
			await TestOnlyFermion().mint(Alice.address, "100");
			// Act
			const result = await ERC20AltApprove().increaseAllowance(Bob.address, 200);
			// Assert
			await EmitOnlyThis(result, Contract, "Approval(address,address,uint256)");
			expect(await TestOnlyERC20().allowance(Alice.address, Bob.address)).to.equal(200);
		});

		it("Fermion.increaseAllowance: Should allow token holder to change allowance multible times", async () =>
		{
			// Arrange
			await TestOnlyFermion().mint(Alice.address, "100");
			// Act
			await ERC20AltApprove().increaseAllowance(Bob.address, 50);
			await ERC20AltApprove().increaseAllowance(Bob.address, 10);
			await ERC20AltApprove().increaseAllowance(Bob.address, 20);
			// Assert
			expect(await TestOnlyERC20().allowance(Alice.address, Bob.address)).to.equal(80);
		});
	});

	context("IERC20Metadata", async () =>
	{
		const ERC20Metadata = () => Contract as IERC20Metadata;

		beforeEach(async () =>
		{
			Contract = await FermionFactory.deploy();
			await Contract.deployed();
		});

		it("Fermion.decimals: Should return correct decimals", async () =>
		{
			// Arrange
			// Act
			const decimals: number = await ERC20Metadata().decimals();
			// Assert
			expect(decimals).to.equal(18);
		});

		it("Fermion.name: Should return correct name", async () =>
		{
			// Arrange
			// Act
			const result = await ERC20Metadata().name();
			// Assert
			expect(result).to.equal("Fermion");
		});

		it("Fermion.symbol: Should return correct symbol", async () =>
		{
			// Arrange
			// Act
			const result = await ERC20Metadata().symbol();
			// Assert
			expect(result).to.equal("EXOFI");
		});
	});

	context("IOwnable", async () =>
	{
		const Ownable = () => Contract as IOwnable;

		beforeEach(async () =>
		{
			Contract = await FermionFactory.deploy();
			await Contract.deployed();
		});

		it("Fermion.constructor: Should set creator as owner", async () =>
		{
			// Arrange
			// Act
			const resultOwner = await Ownable().owner();

			// Assert
			expect(resultOwner).to.equal(Alice.address);
		});

		it("Fermion.renounceOwnership: Should let owner renounce ownership", async () =>
		{
			// Arrange
			// Act
			const result = await Ownable().renounceOwnership();
			// Assert
			await expect(result).to.emit(Contract, "OwnershipTransferred(address,address)").withArgs(Alice.address, ADDRESS_ZERO);
			await EmitOnlyThis(result, Contract, "OwnershipTransferred(address,address)");
			expect(await Ownable().owner()).to.equal(ADDRESS_ZERO);
		});

		it("Fermion.renounceOwnership: Should not let non-owner renounce ownership", async () =>
		{
			// Arrange
			// Act
			const result = Ownable().connect(Bob).renounceOwnership();
			// Assert
			expect(result).to.revertedWith("Ownable: caller is not the owner");
			expect(await Ownable().owner()).to.equal(Alice.address);
		});

		it("Fermion.transferOwnership: Should let owner transfer ownership", async () =>
		{
			// Arrange
			// Act
			const result = await Ownable().transferOwnership(Bob.address);
			// Assert
			await expect(result).to.emit(Contract, "OwnershipTransferred(address,address)").withArgs(Alice.address, Bob.address);
			await EmitOnlyThis(result, Contract, "OwnershipTransferred(address,address)");
			expect(await Ownable().owner()).to.equal(Bob.address);
		});

		it("Fermion.transferOwnership: Should not let owner transfer ownership to zero address", async () =>
		{
			// Arrange
			// Act
			const result = Ownable().transferOwnership(ADDRESS_ZERO);
			// Assert
			expect(result).to.revertedWith("Ownable: new owner is the zero address");
			expect(await Ownable().owner()).to.equal(Alice.address);
		});

		it("Fermion.transferOwnership: Should not let non-owner transfer ownership", async () =>
		{
			// Arrange
			// Act
			const result = Ownable().connect(Carol).transferOwnership(Bob.address);
			// Assert
			expect(result).to.revertedWith("Ownable: caller is not the owner");
			expect(await Ownable().owner()).to.equal(Alice.address);
		});
	});
});
