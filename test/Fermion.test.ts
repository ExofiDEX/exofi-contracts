/* eslint-disable node/no-unpublished-import */
import { ethers } from "hardhat";
import { expect } from "chai";
import { ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ADDRESS_ZERO, AdvanceBlock, EmitOnlyThis, StartAutomine, StopAutomine } from "./helpers";

import { IFermion } from "../typechain-types";

describe("Fermion", () =>
{
	let FermionFactory: ContractFactory;
	let Signers: SignerWithAddress[];
	let Alice: SignerWithAddress;
	let Bob: SignerWithAddress;
	let Carol: SignerWithAddress;
	let Fermion: IFermion;

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
		beforeEach(async () =>
		{
			Fermion = (await FermionFactory.deploy()) as IFermion;
			await Fermion.deployed();
		});

		it("Fermion.mint: Should allow owner to mint", async () =>
		{
			// Arrange
			// Act
			const result = await Fermion.mint(Bob.address, 100);

			// Assert
			await expect(result).to.emit(Fermion, "Transfer(address,address,uint256)").withArgs(ADDRESS_ZERO, Bob.address, 100);
			await EmitOnlyThis(result, Fermion, "Transfer(address,address,uint256)");
			expect(await Fermion.totalSupply()).to.equal(100);
			expect(await Fermion.balanceOf(Bob.address)).to.equal(100);
		});

		it("Fermion.mint: Should not allow non-owner to mint", async () =>
		{
			// Arrange
			// Act
			const result = Fermion.connect(Bob).mint(Bob.address, 100);

			// Assert
			await expect(result).to.revertedWith("Ownable: caller is not the owner");
			expect(await Fermion.totalSupply()).to.equal(0);
			expect(await Fermion.balanceOf(Bob.address)).to.equal(0);
		});
	});

	context("ERC20Burnable", async () =>
	{
		beforeEach(async () =>
		{
			Fermion = (await FermionFactory.deploy()) as IFermion;
			await Fermion.deployed();
		});

		it("Fermion.decimals: Should have correct decimals", async () =>
		{
			// Arrange
			// Act
			const decimals: number = await Fermion.decimals();
			// Assert
			expect(decimals).to.equal(18);
		});

		it("Fermion.name : Should have correct name", async () =>
		{
			// Arrange
			// Act
			const name: string = await Fermion.name();
			// Assert
			expect(name).to.equal("Fermion");
		});

		it("Fermion.symbol: Should have correct symbol", async () =>
		{
			// Arrange
			// Act
			const symbol: string = await Fermion.symbol();
			// Assert
			expect(symbol).to.equal("EXOFI");
		});

		it("Fermion.burn: Should emit `Transfer` event", async () =>
		{
			// Arrange
			await Fermion.mint(Alice.address, 100);
			// Act
			const result = await Fermion.burn(50);
			// Assert
			await expect(result).to.emit(Fermion, "Transfer(address,address,uint256)").withArgs(Alice.address, ADDRESS_ZERO, 50);
			await EmitOnlyThis(result, Fermion, "Transfer(address,address,uint256)");
		});

		it("Fermion.burn: Should allow token holder to burn all of his tokens", async () =>
		{
			// Arrange
			await Fermion.mint(Alice.address, 100);
			await Fermion.mint(Bob.address, 100);
			// Act
			const result = await Fermion.burn(100);
			// Assert
			await expect(result).to.emit(Fermion, "Transfer(address,address,uint256)").withArgs(Alice.address, ADDRESS_ZERO, 100);
			await EmitOnlyThis(result, Fermion, "Transfer(address,address,uint256)");
			expect(await Fermion.totalSupply()).to.equal(100);
			expect(await Fermion.balanceOf(Alice.address)).to.equal(0);
			expect(await Fermion.balanceOf(Bob.address)).to.equal(100);
		});

		it("Fermion.burn: Should allow token holder to burn part of his tokens", async () =>
		{
			// Arrange
			await Fermion.mint(Alice.address, 100);
			await Fermion.mint(Bob.address, 100);
			// Act
			const result = await Fermion.burn(50);
			// Assert
			await expect(result).to.emit(Fermion, "Transfer(address,address,uint256)").withArgs(Alice.address, ADDRESS_ZERO, 50);
			await EmitOnlyThis(result, Fermion, "Transfer(address,address,uint256)");
			expect(await Fermion.totalSupply()).to.equal(150);
			expect(await Fermion.balanceOf(Alice.address)).to.equal(50);
			expect(await Fermion.balanceOf(Bob.address)).to.equal(100);
		});

		it("Fermion.burn: Should not allow token holder to burn more than his tokens", async () =>
		{
			// Arrange
			await Fermion.mint(Alice.address, 100);
			await Fermion.mint(Bob.address, 100);
			// Act
			const result = Fermion.burn(101);
			// Assert
			await expect(result).to.be.revertedWith("ERC20: burn exceeds balance");
			expect(await Fermion.totalSupply()).to.equal(200);
			expect(await Fermion.balanceOf(Alice.address)).to.equal(100);
			expect(await Fermion.balanceOf(Bob.address)).to.equal(100);
		});

		it("Fermion.burnFrom: Should emit `Transfer` and `Approval` event", async () =>
		{
			// Arrange
			await Fermion.mint(Alice.address, 100);
			await Fermion.mint(Bob.address, 100);
			await Fermion.connect(Bob).approve(Alice.address, 50);
			// Act
			const result = await Fermion.burnFrom(Bob.address, 20);
			// Assert
			await expect(result).to.emit(Fermion, "Transfer(address,address,uint256)").withArgs(Bob.address, ADDRESS_ZERO, 20);
			await expect(result).to.emit(Fermion, "Approval(address, address, uint256)").withArgs(Bob.address, Alice.address, 30);
			await EmitOnlyThis(result, Fermion, "Transfer(address,address,uint256)", "Approval(address,address,uint256)");
		});

		it("Fermion.burnFrom: Should allow token holder to burn part of the tokens he got allowance for", async () =>
		{
			// Arrange
			await Fermion.mint(Alice.address, 100);
			await Fermion.mint(Bob.address, 100);
			await Fermion.connect(Bob).approve(Alice.address, 50);
			// Act
			const result = await Fermion.burnFrom(Bob.address, 25);
			// Assert
			await expect(result).to.emit(Fermion, "Transfer(address,address,uint256)").withArgs(Bob.address, ADDRESS_ZERO, 25);
			await expect(result).to.emit(Fermion, "Approval(address, address, uint256)").withArgs(Bob.address, Alice.address, 25);
			await EmitOnlyThis(result, Fermion, "Transfer(address,address,uint256)", "Approval(address,address,uint256)");
			expect(await Fermion.totalSupply()).to.equal(175);
			expect(await Fermion.balanceOf(Alice.address)).to.equal(100);
			expect(await Fermion.balanceOf(Bob.address)).to.equal(75);
			expect(await Fermion.allowance(Bob.address, Alice.address)).to.equal(25);
		});

		it("Fermion.burnFrom: Should allow token holder to burn all of the tokens he got allowance for", async () =>
		{
			// Arrange
			await Fermion.mint(Alice.address, 100);
			await Fermion.mint(Bob.address, 100);
			await Fermion.connect(Bob).approve(Alice.address, 50);
			// Act
			const result = await Fermion.burnFrom(Bob.address, 50);
			// Assert
			await expect(result).to.emit(Fermion, "Transfer(address,address,uint256)").withArgs(Bob.address, ADDRESS_ZERO, 50);
			await expect(result).to.emit(Fermion, "Approval(address, address, uint256)").withArgs(Bob.address, Alice.address, 0);
			await EmitOnlyThis(result, Fermion, "Transfer(address,address,uint256)", "Approval(address,address,uint256)");
			expect(await Fermion.totalSupply()).to.equal(150);
			expect(await Fermion.balanceOf(Alice.address)).to.equal(100);
			expect(await Fermion.balanceOf(Bob.address)).to.equal(50);
			expect(await Fermion.allowance(Bob.address, Alice.address)).to.equal(0);
		});

		it("Fermion.burnFrom: Should not allow token holder to burn more tokens he got allowance for", async () =>
		{
			// Arrange
			await Fermion.mint(Alice.address, 100);
			await Fermion.mint(Bob.address, 100);
			await Fermion.connect(Bob).approve(Alice.address, 50);
			// Act
			const result = Fermion.burnFrom(Bob.address, 51);
			// Assert
			await expect(result).to.be.revertedWith("ERC20: insufficient allowance");
			expect(await Fermion.totalSupply()).to.equal(200);
			expect(await Fermion.balanceOf(Alice.address)).to.equal(100);
			expect(await Fermion.balanceOf(Bob.address)).to.equal(100);
			expect(await Fermion.allowance(Bob.address, Alice.address)).to.equal(50);
		});

		it("Proof of approve/transferFrom attack vector", async () =>
		{
			await Fermion.mint(Alice.address, 100);
			await Fermion.approve(Bob.address, 50);
			await StopAutomine();
			// What happens is that Alice is changing the approved tokens from 50 to 30.
			// Bob notice this before the Transaction of Alice is confirmed and added his on transferFrom transaction.
			// The attack is successfull if the transferFrom transaction is confirmed before the approve transaction or
			// if confirmed in the same block the freansferFrom transaction is processed first.
			// We simulate that second case.
			await Fermion.connect(Bob).transferFrom(Alice.address, Bob.address, 50);
			await Fermion.approve(Bob.address, 30);
			await AdvanceBlock();
			// The Damange is now done. There is no way to prevent this inside the approve method.
			await StartAutomine();
			await Fermion.connect(Bob).transferFrom(Alice.address, Bob.address, 30);

			// TODO: soll nicht sein.
			expect(await Fermion.balanceOf(Alice.address)).to.equal(20);
			expect(await Fermion.balanceOf(Bob.address)).to.equal(80);
		});

		it("Should allow token holder to change allowance", async () =>
		{
			await Fermion.mint(Alice.address, "100");
			await Fermion.mint(Bob.address, "100");

			await Fermion.connect(Bob).increaseAllowance(Alice.address, 50);
			expect(await Fermion.allowance(Bob.address, Alice.address)).to.equal(50);

			await Fermion.connect(Bob).increaseAllowance(Alice.address, 25);
			expect(await Fermion.allowance(Bob.address, Alice.address)).to.equal(75);

			await Fermion.connect(Bob).decreaseAllowance(Alice.address, 50);
			expect(await Fermion.allowance(Bob.address, Alice.address)).to.equal(25);

			await Fermion.connect(Bob).decreaseAllowance(Alice.address, 25);
			expect(await Fermion.allowance(Bob.address, Alice.address)).to.equal(0);
		});

		it("Should not allow spender to be zero addess", async () =>
		{
			await Fermion.mint(Alice.address, "100");
			await Fermion.mint(Bob.address, "100");

			await expect(Fermion.connect(Bob).increaseAllowance(ADDRESS_ZERO, 51)).to.be.revertedWith("ERC20: approve to address(0)");
		});

		it("Should not allow token holder to decrease allowance more than actuall allowance", async () =>
		{
			await Fermion.mint(Alice.address, "100");
			await Fermion.mint(Bob.address, "100");

			await Fermion.connect(Bob).increaseAllowance(Alice.address, 50);
			expect(await Fermion.allowance(Bob.address, Alice.address)).to.equal(50);

			await expect(Fermion.connect(Bob).decreaseAllowance(Alice.address, 51)).to.be.revertedWith("ERC20: reduced allowance below 0");
		});

		it("Should allow token holder to increase allowance even if not hold amount of tokens", async () =>
		{
			await Fermion.mint(Alice.address, "100");
			await Fermion.mint(Bob.address, "100");

			await Fermion.connect(Bob).increaseAllowance(Alice.address, 101);
			expect(await Fermion.allowance(Bob.address, Alice.address)).to.equal(101);
		});

		it("Should only allow owner to mint token", async () =>
		{
			await Fermion.mint(Alice.address, "100");
			await Fermion.mint(Bob.address, "1000");
			await expect(Fermion.connect(Bob).mint(Carol.address, "1000")).to.be.revertedWith("Ownable: caller is not the owner");
			const totalSupply = await Fermion.totalSupply();
			const aliceBal = await Fermion.balanceOf(Alice.address);
			const bobBal = await Fermion.balanceOf(Bob.address);
			const carolBal = await Fermion.balanceOf(Carol.address);
			expect(totalSupply.toString()).to.equal("1100");
			expect(aliceBal.toString()).to.equal("100");
			expect(bobBal.toString()).to.equal("1000");
			expect(carolBal.toString()).to.equal("0");
		});

		it("Should supply token transfers properly", async () =>
		{
			await Fermion.mint(Alice.address, "100");
			await Fermion.mint(Bob.address, "1000");
			await Fermion.transfer(Carol.address, "10");
			await Fermion.connect(Bob).transfer(Carol.address, "100", { from: Bob.address });
			const totalSupply = await Fermion.totalSupply();
			const aliceBal = await Fermion.balanceOf(Alice.address);
			const bobBal = await Fermion.balanceOf(Bob.address);
			const carolBal = await Fermion.balanceOf(Carol.address);
			expect(totalSupply.toString()).to.equal("1100");
			expect(aliceBal.toString()).to.equal("90");
			expect(bobBal.toString()).to.equal("900");
			expect(carolBal.toString()).to.equal("110");
		});

		it("Should fail if you try to do bad transfers", async () =>
		{
			await Fermion.mint(Alice.address, "100");
			await expect(Fermion.transfer(Carol.address, "110")).to.be.revertedWith("ERC20: transfer exceeds balance");
			await expect(Fermion.connect(Bob).transfer(Carol.address, "1")).to.be.revertedWith(
				"ERC20: transfer exceeds balance"
			);
		});
	});

	context("Ownable", async () =>
	{
		beforeEach(async () =>
		{
			Fermion = (await FermionFactory.deploy()) as IFermion;
			await Fermion.deployed();
		});

		it("Fermion.constructor: Should set creator as owner", async () =>
		{
			// Arrange
			// Act
			const resultOwner = await Fermion.owner();

			// Assert
			expect(resultOwner).to.equal(Alice.address);
		});

		it("Fermion.renounceOwnership: Should let owner renounce ownership", async () =>
		{
			// Arrange
			// Act
			const result = await Fermion.renounceOwnership();
			// Assert
			await expect(result).to.emit(Fermion, "OwnershipTransferred(address,address)").withArgs(Alice.address, ADDRESS_ZERO);
			await EmitOnlyThis(result, Fermion, "OwnershipTransferred(address,address)");
			expect(await Fermion.owner()).to.equal(ADDRESS_ZERO);
		});

		it("Fermion.renounceOwnership: Should not let non-owner renounce ownership", async () =>
		{
			// Arrange
			// Act
			const result = Fermion.connect(Bob).renounceOwnership();
			// Assert
			expect(result).to.revertedWith("Ownable: caller is not the owner");
			expect(await Fermion.owner()).to.equal(Alice.address);
		});

		it("Fermion.transferOwnership: Should let owner transfer ownership", async () =>
		{
			// Arrange
			// Act
			const result = await Fermion.transferOwnership(Bob.address);
			// Assert
			await expect(result).to.emit(Fermion, "OwnershipTransferred(address,address)").withArgs(Alice.address, Bob.address);
			await EmitOnlyThis(result, Fermion, "OwnershipTransferred(address,address)");
			expect(await Fermion.owner()).to.equal(Bob.address);
		});

		it("Fermion.transferOwnership: Should not let owner transfer ownership to zero address", async () =>
		{
			// Arrange
			// Act
			const result = Fermion.transferOwnership(ADDRESS_ZERO);
			// Assert
			expect(result).to.revertedWith("Ownable: new owner is the zero address");
			expect(await Fermion.owner()).to.equal(Alice.address);
		});

		it("Fermion.transferOwnership: Should not let non-owner transfer ownership", async () =>
		{
			// Arrange
			// Act
			const result = Fermion.connect(Carol).transferOwnership(Bob.address);
			// Assert
			expect(result).to.revertedWith("Ownable: caller is not the owner");
			expect(await Fermion.owner()).to.equal(Alice.address);
		});
	});
});
