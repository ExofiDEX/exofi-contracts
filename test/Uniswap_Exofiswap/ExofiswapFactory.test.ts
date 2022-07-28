/* eslint-disable node/no-unpublished-import */
import { ethers } from "hardhat";
import { expect } from "chai";
import { BigNumber, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ADDRESS_ZERO, ExpandTo18Decimals, GetCreate2Address, UniGetCreate2Address } from "../helpers";
import { ExofiswapPair, IERC20, IExofiswapFactory, UniswapV2Factory, UniswapV2Pair } from "../../typechain-types";

describe("ExofiswapFactory", () =>
{
	let Signers: SignerWithAddress[];
	let Alice: SignerWithAddress;
	let Bob: SignerWithAddress;
	let UNI_TEST_ADDRESSES: [string, string];
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
		let UniswapV2FactoryFactory: ContractFactory;
		let MockTokenFactory: ContractFactory;
		let ExoContractFactory: ContractFactory;
		let UniContractFactory: ContractFactory;
		let ExoMockToken0: IERC20;
		let ExoMockToken1: IERC20;
		let UniMockToken0: IERC20;
		let UniMockToken1: IERC20;
		let ExofiswapFactory: IExofiswapFactory;
		let UniswapV2Factory: UniswapV2Factory;

		beforeEach(async () =>
		{
			MockTokenFactory = await ethers.getContractFactory("ERC20Mock");
			ExoMockToken0 = (await MockTokenFactory.deploy("MockToken0", "MKT0", ExpandTo18Decimals(1000000000))) as IERC20;
			await ExoMockToken0.deployed();
			ExoMockToken1 = (await MockTokenFactory.deploy("MockToken1", "MKT1", ExpandTo18Decimals(1000000000))) as IERC20;
			await ExoMockToken1.deployed();
			UniMockToken0 = (await MockTokenFactory.deploy("MockToken0", "MKT0", ExpandTo18Decimals(1000000000))) as IERC20;
			await UniMockToken0.deployed();
			UniMockToken1 = (await MockTokenFactory.deploy("MockToken1", "MKT1", ExpandTo18Decimals(1000000000))) as IERC20;
			await UniMockToken1.deployed();

			if (ExoMockToken0.address > ExoMockToken1.address)
			{
				const help = ExoMockToken1;
				ExoMockToken1 = ExoMockToken0;
				ExoMockToken0 = help;
			}

			if (UniMockToken0.address > UniMockToken1.address)
			{
				const help = UniMockToken1;
				UniMockToken1 = UniMockToken0;
				UniMockToken0 = help;
			}

			UNI_TEST_ADDRESSES = [UniMockToken0.address, UniMockToken1.address];
			EXO_TEST_ADDRESSES = [ExoMockToken0.address, ExoMockToken1.address];

			ExofiswapFactoryFactory = await ethers.getContractFactory("ExofiswapFactory");
			UniswapV2FactoryFactory = await ethers.getContractFactory("UniswapV2Factory");
			ExofiswapFactory = (await ExofiswapFactoryFactory.deploy()) as IExofiswapFactory;
			await ExofiswapFactory.deployed();
			UniswapV2Factory = (await UniswapV2FactoryFactory.deploy(Alice.address)) as UniswapV2Factory;
			await UniswapV2Factory.deployed();

			UniContractFactory = await ethers.getContractFactory("UniswapV2Pair");
			ExoContractFactory = await ethers.getContractFactory("ExofiswapPair");
		});

		it("ExofiswapFactory.constructor: Should set correct state variables", async () =>
		{
			expect(await ExofiswapFactory.feeTo()).to.equal(ADDRESS_ZERO);
			expect(await ExofiswapFactory.owner()).to.equal(Alice.address);
			expect(await ExofiswapFactory.allPairsLength()).to.equal(0);
			expect(await ExofiswapFactory.migrator()).to.equal(ADDRESS_ZERO);

			expect(await UniswapV2Factory.feeTo()).to.eq(ADDRESS_ZERO);
			expect(await UniswapV2Factory.feeToSetter()).to.eq(Alice.address);
			expect(await UniswapV2Factory.allPairsLength()).to.eq(0);
			expect(await UniswapV2Factory.migrator()).to.equal(ADDRESS_ZERO);
		});

		async function CreatePair(uniTokens: [string, string], exoTokens: [string, string])
		{
			const uniBytecode = UniContractFactory.bytecode;
			const exoBytecode = ExoContractFactory.bytecode;

			const uniCreate2Address = UniGetCreate2Address(UniswapV2Factory.address, uniTokens, uniBytecode);
			const exoCreate2Address = GetCreate2Address(ExofiswapFactory.address, exoTokens, exoBytecode);

			await expect(UniswapV2Factory.createPair(...uniTokens))
				.to.emit(UniswapV2Factory, "PairCreated")
				.withArgs(UNI_TEST_ADDRESSES[0], UNI_TEST_ADDRESSES[1], uniCreate2Address, BigNumber.from(1));
			await expect(ExofiswapFactory.createPair(...exoTokens))
				.to.emit(ExofiswapFactory, "PairCreated")
				.withArgs(EXO_TEST_ADDRESSES[0], EXO_TEST_ADDRESSES[1], exoCreate2Address, BigNumber.from(1));

			const uniReverseTokens: [string, string] = [uniTokens[1], uniTokens[0]];
			await expect(UniswapV2Factory.createPair(...uniTokens)).to.be.reverted; // UniswapV2: PAIR_EXISTS
			await expect(UniswapV2Factory.createPair(...uniReverseTokens)).to.be.reverted; // UniswapV2: PAIR_EXISTS
			expect(await UniswapV2Factory.getPair(...uniTokens)).to.eq(uniCreate2Address);
			expect(await UniswapV2Factory.getPair(...uniReverseTokens)).to.eq(uniCreate2Address);
			expect(await UniswapV2Factory.allPairs(0)).to.eq(uniCreate2Address);
			expect(await UniswapV2Factory.allPairsLength()).to.eq(1);

			const exoReverseTokens: [string, string] = [exoTokens[1], exoTokens[0]];
			await expect(ExofiswapFactory.createPair(...exoTokens)).to.be.reverted; // Exofiswap: PAIR_EXISTS
			await expect(ExofiswapFactory.createPair(...exoReverseTokens)).to.be.reverted; // UniswapV2: PAIR_EXISTS
			expect(await ExofiswapFactory.getPair(...exoTokens)).to.eq(exoCreate2Address);
			expect(await ExofiswapFactory.getPair(...exoReverseTokens)).to.eq(exoCreate2Address);
			expect(await ExofiswapFactory.allPairs(0)).to.eq(exoCreate2Address);
			expect(await ExofiswapFactory.allPairsLength()).to.eq(1);

			const uniPair = await ethers.getContractAt("UniswapV2Pair", uniCreate2Address) as UniswapV2Pair;
			expect(await uniPair.factory()).to.eq(UniswapV2Factory.address);
			expect(await uniPair.token0()).to.eq(UNI_TEST_ADDRESSES[0]);
			expect(await uniPair.token1()).to.eq(UNI_TEST_ADDRESSES[1]);

			const exoPair = await ethers.getContractAt("ExofiswapPair", exoCreate2Address) as ExofiswapPair;
			expect(await exoPair.factory()).to.eq(ExofiswapFactory.address);
			expect(await exoPair.token0()).to.eq(EXO_TEST_ADDRESSES[0]);
			expect(await exoPair.token1()).to.eq(EXO_TEST_ADDRESSES[1]);
		}

		it("createPair", async () =>
		{
			await CreatePair(UNI_TEST_ADDRESSES, EXO_TEST_ADDRESSES);
		});

		it("createPair:reverse", async () =>
		{
			await CreatePair(UNI_TEST_ADDRESSES.slice().reverse() as [string, string], EXO_TEST_ADDRESSES.slice().reverse() as [string, string]);
		});

		it("setFeeTo", async () =>
		{
			expect(await UniswapV2Factory.feeTo()).to.eq(ADDRESS_ZERO);
			await expect(UniswapV2Factory.connect(Bob).setFeeTo(Bob.address)).to.be.revertedWith("UniswapV2: FORBIDDEN");
			expect(await UniswapV2Factory.feeTo()).to.eq(ADDRESS_ZERO);
			await UniswapV2Factory.setFeeTo(Alice.address);
			expect(await UniswapV2Factory.feeTo()).to.eq(Alice.address);

			expect(await ExofiswapFactory.feeTo()).to.eq(ADDRESS_ZERO);
			await expect(ExofiswapFactory.connect(Bob).setFeeTo(Bob.address)).to.be.revertedWith("Ownable: caller is not the owner");
			expect(await ExofiswapFactory.feeTo()).to.eq(ADDRESS_ZERO);
			await ExofiswapFactory.setFeeTo(Alice.address);
			expect(await ExofiswapFactory.feeTo()).to.eq(Alice.address);
		});

		it("setFeeToSetter", async () =>
		{
			await expect(UniswapV2Factory.connect(Bob).setFeeToSetter(Bob.address)).to.be.revertedWith("UniswapV2: FORBIDDEN");
			await UniswapV2Factory.setFeeToSetter(Bob.address);
			expect(await UniswapV2Factory.feeToSetter()).to.eq(Bob.address);
			await expect(UniswapV2Factory.setFeeToSetter(Alice.address)).to.be.revertedWith("UniswapV2: FORBIDDEN");

			await expect(ExofiswapFactory.connect(Bob).transferOwnership(Bob.address)).to.be.revertedWith("Ownable: caller is not the owner");
			await ExofiswapFactory.transferOwnership(Bob.address);
			expect(await ExofiswapFactory.owner()).to.eq(Bob.address);
			await expect(ExofiswapFactory.transferOwnership(Alice.address)).to.be.revertedWith("Ownable: caller is not the owner");
		});
	});
});
