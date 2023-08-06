import { ethers } from "hardhat";
import { expect } from "chai";
import { BigNumber, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ADDRESS_ZERO, ExpandTo18Decimals, GetCreate2Address } from "../helpers";
import { ExofiswapPair, IERC20, IExofiswapFactory } from "../../typechain-types";

describe("ExofiswapFactory", () =>
{
	let Signers: SignerWithAddress[];
	let Alice: SignerWithAddress;
	let Bob: SignerWithAddress;
	let EXO_TEST_ADDRESSES: [string, string];

	before(async () =>
	{
		Signers = await ethers.getSigners();
		Alice = Signers[0];
		Bob = Signers[1];
	});

	context("this", () =>
	{
		let ExofiswapFactoryFactory: ContractFactory;
		let MockTokenFactory: ContractFactory;
		let ExoContractFactory: ContractFactory;
		let ExoMockToken0: IERC20;
		let ExoMockToken1: IERC20;
		let ExofiswapFactory: IExofiswapFactory;

		beforeEach(async () =>
		{
			MockTokenFactory = await ethers.getContractFactory("ERC20Mock");
			ExoMockToken0 = (await MockTokenFactory.deploy("MockToken0", "MKT0", ExpandTo18Decimals(1000000000))) as IERC20;
			await ExoMockToken0.deployed();
			ExoMockToken1 = (await MockTokenFactory.deploy("MockToken1", "MKT1", ExpandTo18Decimals(1000000000))) as IERC20;
			await ExoMockToken1.deployed();

			if (ExoMockToken0.address > ExoMockToken1.address)
			{
				const help = ExoMockToken1;
				ExoMockToken1 = ExoMockToken0;
				ExoMockToken0 = help;
			}

			EXO_TEST_ADDRESSES = [ExoMockToken0.address, ExoMockToken1.address];

			ExofiswapFactoryFactory = await ethers.getContractFactory("ExofiswapFactory");
			ExofiswapFactory = (await ExofiswapFactoryFactory.deploy()) as IExofiswapFactory;
			await ExofiswapFactory.deployed();

			ExoContractFactory = await ethers.getContractFactory("ExofiswapPair");
		});

		it("ExofiswapFactory.constructor: Should set correct state variables", async () =>
		{
			expect(await ExofiswapFactory.feeTo()).to.equal(ADDRESS_ZERO);
			expect(await ExofiswapFactory.owner()).to.equal(Alice.address);
			expect(await ExofiswapFactory.allPairsLength()).to.equal(0);
			expect(await ExofiswapFactory.migrator()).to.equal(ADDRESS_ZERO);
		});

		async function CreatePair(exoTokens: [string, string])
		{
			const exoBytecode = ExoContractFactory.bytecode;

			const exoCreate2Address = GetCreate2Address(ExofiswapFactory.address, exoTokens, exoBytecode);

			await expect(ExofiswapFactory.createPair(...exoTokens))
				.to.emit(ExofiswapFactory, "PairCreated")
				.withArgs(EXO_TEST_ADDRESSES[0], EXO_TEST_ADDRESSES[1], exoCreate2Address, BigNumber.from(1));

			const exoReverseTokens: [string, string] = [exoTokens[1], exoTokens[0]];
			await expect(ExofiswapFactory.createPair(...exoTokens)).to.be.reverted; // Exofiswap: PAIR_EXISTS
			await expect(ExofiswapFactory.createPair(...exoReverseTokens)).to.be.reverted; // Exofiswap: PAIR_EXISTS
			expect(await ExofiswapFactory.getPair(...exoTokens)).to.eq(exoCreate2Address);
			expect(await ExofiswapFactory.getPair(...exoReverseTokens)).to.eq(exoCreate2Address);
			expect(await ExofiswapFactory.allPairs(0)).to.eq(exoCreate2Address);
			expect(await ExofiswapFactory.allPairsLength()).to.eq(1);

			const exoPair = await ethers.getContractAt("ExofiswapPair", exoCreate2Address) as ExofiswapPair;
			expect(await exoPair.factory()).to.eq(ExofiswapFactory.address);
			expect(await exoPair.token0()).to.eq(EXO_TEST_ADDRESSES[0]);
			expect(await exoPair.token1()).to.eq(EXO_TEST_ADDRESSES[1]);

			const ExofiswapPairFactory: ContractFactory = await ethers.getContractFactory("ExofiswapPair");
			expect(exoCreate2Address).to.equal(GetCreate2Address(ExofiswapFactory.address, EXO_TEST_ADDRESSES, ExofiswapPairFactory.bytecode));
		}

		it("createPair", async () =>
		{
			await CreatePair(EXO_TEST_ADDRESSES);
		});

		it("createPair:reverse", async () =>
		{
			await CreatePair(EXO_TEST_ADDRESSES.slice().reverse() as [string, string]);
		});

		it("setFeeTo", async () =>
		{
			expect(await ExofiswapFactory.feeTo()).to.eq(ADDRESS_ZERO);
			await expect(ExofiswapFactory.connect(Bob).setFeeTo(Bob.address)).to.be.revertedWith("Ownable: caller is not the owner");
			expect(await ExofiswapFactory.feeTo()).to.eq(ADDRESS_ZERO);
			await ExofiswapFactory.setFeeTo(Alice.address);
			expect(await ExofiswapFactory.feeTo()).to.eq(Alice.address);
		});

		it("setFeeToSetter", async () =>
		{
			await expect(ExofiswapFactory.connect(Bob).transferOwnership(Bob.address)).to.be.revertedWith("Ownable: caller is not the owner");
			await ExofiswapFactory.transferOwnership(Bob.address);
			expect(await ExofiswapFactory.owner()).to.eq(Bob.address);
			await expect(ExofiswapFactory.transferOwnership(Alice.address)).to.be.revertedWith("Ownable: caller is not the owner");
		});

		it("pairCodeHash", async () =>
		{
			expect(await ExofiswapFactory.pairCodeHash()).eq("0x249895517e40838f4b1dd16d4fcf91c721a6326947a6f8535e3ad8f94a649f81");
		});
	});
});
