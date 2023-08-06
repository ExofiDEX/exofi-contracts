import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ADDRESS_ZERO, PANIC_CODES } from "./helpers";

import { IUniqueAddressList } from "../typechain-types";

describe("UniqueAdressList", () =>
{
	let UniqueAddressListFactory: ContractFactory;
	let Signers: SignerWithAddress[];
	let Alice: SignerWithAddress;
	let Bob: SignerWithAddress;
	let Carol: SignerWithAddress;
	let Contract: Contract;

	before(async () =>
	{
		UniqueAddressListFactory = await ethers.getContractFactory("UniqueAddressList");
		Signers = await ethers.getSigners();
		Alice = Signers[0];
		Bob = Signers[1];
		Carol = Signers[2];
	});

	context("this", async () =>
	{
		const UniqueAddressList = () => Contract as IUniqueAddressList;

		beforeEach(async () =>
		{
			Contract = await UniqueAddressListFactory.deploy();
			await Contract.deployed();
		});

		it("UniqueAdressList.constructor: Should initialize correctly", async () =>
		{
			// Arrange
			// Act
			// Assert
			expect(await UniqueAddressList().indexOf(ADDRESS_ZERO)).to.equal(0);
			expect(await UniqueAddressList().peek(0)).to.equal(ADDRESS_ZERO);
		});

		it("UniqueAdressList.add: Should add new address", async () =>
		{
			// Arrange
			// Act
			await UniqueAddressList().add(Alice.address);
			await UniqueAddressList().add(Bob.address);
			await UniqueAddressList().add(Carol.address);
			// Assert
			expect(await UniqueAddressList().peek(0)).to.equal(ADDRESS_ZERO);
			expect(await UniqueAddressList().peek(1)).to.equal(Alice.address);
			expect(await UniqueAddressList().peek(2)).to.equal(Bob.address);
			expect(await UniqueAddressList().peek(3)).to.equal(Carol.address);

			expect(await UniqueAddressList().indexOf(ADDRESS_ZERO)).to.equal(0);
			expect(await UniqueAddressList().indexOf(Alice.address)).to.equal(1);
			expect(await UniqueAddressList().indexOf(Bob.address)).to.equal(2);
			expect(await UniqueAddressList().indexOf(Carol.address)).to.equal(3);
		});

		it("UniqueAdressList.add: Should not add zero address", async () =>
		{
			// Arrange
			// Act
			await UniqueAddressList().add(ADDRESS_ZERO);
			// Assert
			await expect(UniqueAddressList().peek(1)).to.revertedWithPanic(PANIC_CODES.ArrayOutOfBounds);
		});

		it("UniqueAdressList.add: Should not add addresses twice", async () =>
		{
			// Arrange
			// Act
			await UniqueAddressList().add(Alice.address);
			await UniqueAddressList().add(Alice.address);
			await UniqueAddressList().add(Bob.address);
			await UniqueAddressList().add(Alice.address);
			await UniqueAddressList().add(Bob.address);
			await UniqueAddressList().add(Carol.address);
			await UniqueAddressList().add(Alice.address);
			await UniqueAddressList().add(Carol.address);
			await UniqueAddressList().add(Bob.address);
			await UniqueAddressList().add(Alice.address);
			// Assert
			expect(await UniqueAddressList().peek(0)).to.equal(ADDRESS_ZERO);
			expect(await UniqueAddressList().peek(1)).to.equal(Alice.address);
			expect(await UniqueAddressList().peek(2)).to.equal(Bob.address);
			expect(await UniqueAddressList().peek(3)).to.equal(Carol.address);

			expect(await UniqueAddressList().indexOf(ADDRESS_ZERO)).to.equal(0);
			expect(await UniqueAddressList().indexOf(Alice.address)).to.equal(1);
			expect(await UniqueAddressList().indexOf(Bob.address)).to.equal(2);
			expect(await UniqueAddressList().indexOf(Carol.address)).to.equal(3);
		});

		it("UniqueAdressList.remove: Should remove last added entry", async () =>
		{
			// Arrange
			await UniqueAddressList().add(Alice.address);
			await UniqueAddressList().add(Bob.address);
			await UniqueAddressList().add(Carol.address);
			// Act
			await UniqueAddressList().remove(Carol.address);
			// Assert
			expect(await UniqueAddressList().peek(0)).to.equal(ADDRESS_ZERO);
			expect(await UniqueAddressList().peek(1)).to.equal(Alice.address);
			expect(await UniqueAddressList().peek(2)).to.equal(Bob.address);
			await expect(UniqueAddressList().peek(3)).to.revertedWithPanic(PANIC_CODES.ArrayOutOfBounds);

			expect(await UniqueAddressList().indexOf(ADDRESS_ZERO)).to.equal(0);
			expect(await UniqueAddressList().indexOf(Alice.address)).to.equal(1);
			expect(await UniqueAddressList().indexOf(Bob.address)).to.equal(2);
			expect(await UniqueAddressList().indexOf(Carol.address)).to.equal(0);
		});

		it("UniqueAdressList.remove: Should remove first added entry", async () =>
		{
			// Arrange
			await UniqueAddressList().add(Alice.address);
			await UniqueAddressList().add(Bob.address);
			await UniqueAddressList().add(Carol.address);
			// Act
			await UniqueAddressList().remove(Alice.address);
			// Assert
			expect(await UniqueAddressList().peek(0)).to.equal(ADDRESS_ZERO);
			expect(await UniqueAddressList().peek(1)).to.equal(Carol.address);
			expect(await UniqueAddressList().peek(2)).to.equal(Bob.address);
			await expect(UniqueAddressList().peek(3)).to.revertedWithPanic(PANIC_CODES.ArrayOutOfBounds);

			expect(await UniqueAddressList().indexOf(ADDRESS_ZERO)).to.equal(0);
			expect(await UniqueAddressList().indexOf(Alice.address)).to.equal(0);
			expect(await UniqueAddressList().indexOf(Bob.address)).to.equal(2);
			expect(await UniqueAddressList().indexOf(Carol.address)).to.equal(1);
		});

		it("UniqueAdressList.remove: Should remove second added entry", async () =>
		{
			// Arrange
			await UniqueAddressList().add(Alice.address);
			await UniqueAddressList().add(Bob.address);
			await UniqueAddressList().add(Carol.address);
			// Act
			await UniqueAddressList().remove(Bob.address);
			// Assert
			expect(await UniqueAddressList().peek(0)).to.equal(ADDRESS_ZERO);
			expect(await UniqueAddressList().peek(1)).to.equal(Alice.address);
			expect(await UniqueAddressList().peek(2)).to.equal(Carol.address);
			await expect(UniqueAddressList().peek(3)).to.revertedWithPanic(PANIC_CODES.ArrayOutOfBounds);

			expect(await UniqueAddressList().indexOf(ADDRESS_ZERO)).to.equal(0);
			expect(await UniqueAddressList().indexOf(Alice.address)).to.equal(1);
			expect(await UniqueAddressList().indexOf(Bob.address)).to.equal(0);
			expect(await UniqueAddressList().indexOf(Carol.address)).to.equal(2);
		});

		it("UniqueAdressList.remove: Should remove all added entry", async () =>
		{
			// Arrange
			await UniqueAddressList().add(Alice.address);
			await UniqueAddressList().add(Bob.address);
			await UniqueAddressList().add(Carol.address);
			// Act
			await UniqueAddressList().remove(Alice.address);
			await UniqueAddressList().remove(Bob.address);
			await UniqueAddressList().remove(Carol.address);
			// Assert
			expect(await UniqueAddressList().peek(0)).to.equal(ADDRESS_ZERO);
			await expect(UniqueAddressList().peek(1)).to.revertedWithPanic(PANIC_CODES.ArrayOutOfBounds);
			await expect(UniqueAddressList().peek(2)).to.revertedWithPanic(PANIC_CODES.ArrayOutOfBounds);
			await expect(UniqueAddressList().peek(3)).to.revertedWithPanic(PANIC_CODES.ArrayOutOfBounds);

			expect(await UniqueAddressList().indexOf(ADDRESS_ZERO)).to.equal(0);
			expect(await UniqueAddressList().indexOf(Alice.address)).to.equal(0);
			expect(await UniqueAddressList().indexOf(Bob.address)).to.equal(0);
			expect(await UniqueAddressList().indexOf(Carol.address)).to.equal(0);
		});
	});
});
