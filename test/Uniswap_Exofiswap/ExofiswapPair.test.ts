/* eslint-disable node/no-unpublished-import */
import { ethers, network } from "hardhat";
import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ADDRESS_ZERO, AdvanceBlock, EncodePrice, ExpandTo18Decimals, StartAutomine, StopAutomine } from "../helpers";
import { IERC20, IERC20Metadata, IExofiswapFactory, IExofiswapPair, UniswapV2Factory, UniswapV2Pair } from "../../typechain-types";

describe("ExofiswapPair", () =>
{
	let Signers: SignerWithAddress[];
	let Alice: SignerWithAddress;
	let Bob: SignerWithAddress;
	const MINIMUM_LIQUIDITY = 1000;

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
		let ExoContract: Contract;
		let UniContract: Contract;
		let ExoMockToken0: IERC20Metadata;
		let ExoMockToken1: IERC20Metadata;
		let UniMockToken0: IERC20;
		let UniMockToken1: IERC20;
		let ExofiswapFactory: IExofiswapFactory;
		let UniswapV2Factory: UniswapV2Factory;
		const ExofiswapPair = () => ExoContract as IExofiswapPair;
		const UniswapV2Pair = () => UniContract as UniswapV2Pair;

		beforeEach(async () =>
		{
			MockTokenFactory = await ethers.getContractFactory("ERC20Mock");
			ExoMockToken0 = (await MockTokenFactory.deploy("MockToken0", "MKT0", ExpandTo18Decimals(1000000000))) as IERC20Metadata;
			await ExoMockToken0.deployed();
			ExoMockToken1 = (await MockTokenFactory.deploy("MockToken1", "MKT1", ExpandTo18Decimals(1000000000))) as IERC20Metadata;
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

			ExofiswapFactoryFactory = await ethers.getContractFactory("ExofiswapFactory");
			UniswapV2FactoryFactory = await ethers.getContractFactory("UniswapV2Factory");
			ExofiswapFactory = (await ExofiswapFactoryFactory.deploy()) as IExofiswapFactory;
			await ExofiswapFactory.deployed();
			UniswapV2Factory = (await UniswapV2FactoryFactory.deploy(Alice.address)) as UniswapV2Factory;
			await UniswapV2Factory.deployed();

			const exoTransaction = await ExofiswapFactory.createPair(ExoMockToken0.address, ExoMockToken1.address);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const exoReceipt: any = await exoTransaction.wait();
			const exoAddress = exoReceipt.events[0].decode(exoReceipt.events[0].data).pair;
			ExoContract = await ethers.getContractAt("ExofiswapPair", exoAddress);

			const uniTransaction = await UniswapV2Factory.createPair(UniMockToken0.address, UniMockToken1.address);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const uniReceipt: any = await uniTransaction.wait();
			const uniAddress = uniReceipt.events[0].decode(uniReceipt.events[0].data).pair;
			UniContract = await ethers.getContractAt("UniswapV2Pair", uniAddress);
		});

		it("ExofiswapPair.constructor + initialize: Should set correct state variables", async () =>
		{
			expect(await ExofiswapPair().token0()).to.equal(ExoMockToken0.address);
			expect(await ExofiswapPair().token1()).to.equal(ExoMockToken1.address);
			expect(await ExofiswapPair().factory()).to.equal(ExofiswapFactory.address);
			expect(await ExofiswapPair().symbol()).to.equal("ENERGY");
			expect(await ExofiswapPair().decimals()).to.equal(18);
			const exoPairName = `${await ExoMockToken0.symbol()}/${await ExoMockToken1.symbol()} Plasma`;
			expect(await ExofiswapPair().name()).to.equal(exoPairName);
			expect(await ExofiswapPair().MINIMUM_LIQUIDITY()).to.equal(MINIMUM_LIQUIDITY);

			expect(await UniswapV2Pair().token0()).to.equal(UniMockToken0.address);
			expect(await UniswapV2Pair().token1()).to.equal(UniMockToken1.address);
			expect(await UniswapV2Pair().factory()).to.equal(UniswapV2Factory.address);
			expect(await UniswapV2Pair().symbol()).to.equal("SLP");
			expect(await UniswapV2Pair().decimals()).to.equal(18);
			expect(await UniswapV2Pair().name()).to.equal("SushiSwap LP Token");
			expect(await UniswapV2Pair().MINIMUM_LIQUIDITY()).to.equal(MINIMUM_LIQUIDITY);
		});

		it("mint", async () =>
		{
			const token0Amount = ExpandTo18Decimals(1);
			const token1Amount = ExpandTo18Decimals(4);

			await ExoMockToken0.transfer(ExoContract.address, token0Amount);
			await UniMockToken0.transfer(UniContract.address, token0Amount);
			await ExoMockToken1.transfer(ExoContract.address, token1Amount);
			await UniMockToken1.transfer(UniContract.address, token1Amount);

			const expectedLiquidity = ExpandTo18Decimals(2);

			await expect(ExofiswapPair().mint(Alice.address))
				.to.emit(ExoContract, "Transfer").withArgs(ADDRESS_ZERO, ADDRESS_ZERO, MINIMUM_LIQUIDITY)
				.to.emit(ExoContract, "Transfer").withArgs(ADDRESS_ZERO, Alice.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
				.to.emit(ExoContract, "Sync").withArgs(token0Amount, token1Amount)
				.to.emit(ExoContract, "Mint").withArgs(Alice.address, token0Amount, token1Amount);
			await expect(UniswapV2Pair().mint(Alice.address))
				.to.emit(UniContract, "Transfer").withArgs(ADDRESS_ZERO, ADDRESS_ZERO, MINIMUM_LIQUIDITY)
				.to.emit(UniContract, "Transfer").withArgs(ADDRESS_ZERO, Alice.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
				.to.emit(UniContract, "Sync").withArgs(token0Amount, token1Amount)
				.to.emit(UniContract, "Mint").withArgs(Alice.address, token0Amount, token1Amount);

			expect(await ExofiswapPair().totalSupply()).to.eq(expectedLiquidity);
			expect(await UniswapV2Pair().totalSupply()).to.eq(expectedLiquidity);

			expect(await ExofiswapPair().balanceOf(Alice.address)).to.eq(expectedLiquidity.sub(MINIMUM_LIQUIDITY));
			expect(await UniswapV2Pair().balanceOf(Alice.address)).to.eq(expectedLiquidity.sub(MINIMUM_LIQUIDITY));

			expect(await ExoMockToken0.balanceOf(ExofiswapPair().address)).to.eq(token0Amount);
			expect(await UniMockToken0.balanceOf(UniswapV2Pair().address)).to.eq(token0Amount);

			expect(await ExoMockToken1.balanceOf(ExofiswapPair().address)).to.eq(token1Amount);
			expect(await UniMockToken1.balanceOf(UniswapV2Pair().address)).to.eq(token1Amount);

			const exoReserves = await ExofiswapPair().getReserves();
			const uniReserves = await UniswapV2Pair().getReserves();

			expect(exoReserves[0]).to.eq(token0Amount);
			expect(uniReserves[0]).to.eq(token0Amount);

			expect(exoReserves[1]).to.eq(token1Amount);
			expect(uniReserves[1]).to.eq(token1Amount);
		});

		async function addLiquidity(token0Amount: BigNumber, token1Amount: BigNumber)
		{
			await ExoMockToken0.transfer(ExofiswapPair().address, token0Amount);
			await UniMockToken0.transfer(UniswapV2Pair().address, token0Amount);

			await ExoMockToken1.transfer(ExofiswapPair().address, token1Amount);
			await UniMockToken1.transfer(UniswapV2Pair().address, token1Amount);

			await ExofiswapPair().mint(Alice.address);
			await UniswapV2Pair().mint(Alice.address);
		}

		it("swap:token0", async () =>
		{
			const token0Amount = ExpandTo18Decimals(5);
			const token1Amount = ExpandTo18Decimals(10);
			await addLiquidity(token0Amount, token1Amount);
			expect(await ExoMockToken0.balanceOf(ExoContract.address)).is.eq(token0Amount);
			expect(await ExoMockToken1.balanceOf(ExoContract.address)).is.eq(token1Amount);

			const swapAmount = ExpandTo18Decimals(1);
			const expectedOutputAmount = BigNumber.from("1662497915624478906");

			await ExoMockToken0.transfer(ExofiswapPair().address, swapAmount);
			await UniMockToken0.transfer(UniswapV2Pair().address, swapAmount);

			await expect(ExofiswapPair().swap(0, expectedOutputAmount, Alice.address, "0x"))
				.to.emit(ExoMockToken1, "Transfer").withArgs(ExofiswapPair().address, Alice.address, expectedOutputAmount)
				.to.emit(ExofiswapPair(), "Sync").withArgs(token0Amount.add(swapAmount), token1Amount.sub(expectedOutputAmount))
				.to.emit(ExofiswapPair(), "Swap").withArgs(Alice.address, swapAmount, 0, 0, expectedOutputAmount, Alice.address);
			await expect(UniswapV2Pair().swap(0, expectedOutputAmount, Alice.address, "0x"))
				.to.emit(UniMockToken1, "Transfer").withArgs(UniswapV2Pair().address, Alice.address, expectedOutputAmount)
				.to.emit(UniswapV2Pair(), "Sync").withArgs(token0Amount.add(swapAmount), token1Amount.sub(expectedOutputAmount))
				.to.emit(UniswapV2Pair(), "Swap").withArgs(Alice.address, swapAmount, 0, 0, expectedOutputAmount, Alice.address);

			const exoReserves = await ExofiswapPair().getReserves();
			const uniReserves = await UniswapV2Pair().getReserves();

			expect(exoReserves[0]).to.eq(token0Amount.add(swapAmount));
			expect(uniReserves[0]).to.eq(token0Amount.add(swapAmount));

			expect(exoReserves[1]).to.eq(token1Amount.sub(expectedOutputAmount));
			expect(uniReserves[1]).to.eq(token1Amount.sub(expectedOutputAmount));

			expect(await ExoMockToken0.balanceOf(ExofiswapPair().address)).to.eq(token0Amount.add(swapAmount));
			expect(await UniMockToken0.balanceOf(UniswapV2Pair().address)).to.eq(token0Amount.add(swapAmount));

			expect(await ExoMockToken1.balanceOf(ExofiswapPair().address)).to.eq(token1Amount.sub(expectedOutputAmount));
			expect(await UniMockToken1.balanceOf(UniswapV2Pair().address)).to.eq(token1Amount.sub(expectedOutputAmount));

			const exoTotalSupplyToken0 = await ExoMockToken0.totalSupply();
			const exoTotalSupplyToken1 = await ExoMockToken1.totalSupply();
			const uniTotalSupplyToken0 = await UniMockToken0.totalSupply();
			const uniTotalSupplyToken1 = await UniMockToken1.totalSupply();

			expect(await ExoMockToken0.balanceOf(Alice.address)).to.eq(exoTotalSupplyToken0.sub(token0Amount).sub(swapAmount));
			expect(await UniMockToken0.balanceOf(Alice.address)).to.eq(uniTotalSupplyToken0.sub(token0Amount).sub(swapAmount));

			expect(await ExoMockToken1.balanceOf(Alice.address)).to.eq(exoTotalSupplyToken1.sub(token1Amount).add(expectedOutputAmount));
			expect(await UniMockToken1.balanceOf(Alice.address)).to.eq(uniTotalSupplyToken1.sub(token1Amount).add(expectedOutputAmount));
		});

		it("swap:token1", async () =>
		{
			const token0Amount = ExpandTo18Decimals(5);
			const token1Amount = ExpandTo18Decimals(10);
			await addLiquidity(token0Amount, token1Amount);

			const swapAmount = ExpandTo18Decimals(1);
			const expectedOutputAmount = BigNumber.from("453305446940074565");

			await ExoMockToken1.transfer(ExofiswapPair().address, swapAmount);
			await UniMockToken1.transfer(UniswapV2Pair().address, swapAmount);

			await expect(ExofiswapPair().swap(expectedOutputAmount, 0, Alice.address, "0x"))
				.to.emit(ExoMockToken1, "Transfer").withArgs(ExofiswapPair().address, Alice.address, expectedOutputAmount)
				.to.emit(ExofiswapPair(), "Sync").withArgs(token0Amount.sub(expectedOutputAmount), token1Amount.add(swapAmount))
				.to.emit(ExofiswapPair(), "Swap").withArgs(Alice.address, 0, swapAmount, expectedOutputAmount, 0, Alice.address);
			await expect(UniswapV2Pair().swap(expectedOutputAmount, 0, Alice.address, "0x"))
				.to.emit(UniMockToken1, "Transfer").withArgs(UniswapV2Pair().address, Alice.address, expectedOutputAmount)
				.to.emit(UniswapV2Pair(), "Sync").withArgs(token0Amount.sub(expectedOutputAmount), token1Amount.add(swapAmount))
				.to.emit(UniswapV2Pair(), "Swap").withArgs(Alice.address, 0, swapAmount, expectedOutputAmount, 0, Alice.address);

			const exoReserves = await ExofiswapPair().getReserves();
			const uniReserves = await UniswapV2Pair().getReserves();

			expect(exoReserves[0]).to.eq(token0Amount.sub(expectedOutputAmount));
			expect(uniReserves[0]).to.eq(token0Amount.sub(expectedOutputAmount));

			expect(exoReserves[1]).to.eq(token1Amount.add(swapAmount));
			expect(uniReserves[1]).to.eq(token1Amount.add(swapAmount));

			expect(await ExoMockToken0.balanceOf(ExofiswapPair().address)).to.eq(token0Amount.sub(expectedOutputAmount));
			expect(await UniMockToken0.balanceOf(UniswapV2Pair().address)).to.eq(token0Amount.sub(expectedOutputAmount));

			expect(await ExoMockToken1.balanceOf(ExofiswapPair().address)).to.eq(token1Amount.add(swapAmount));
			expect(await UniMockToken1.balanceOf(UniswapV2Pair().address)).to.eq(token1Amount.add(swapAmount));

			const exoTotalSupplyToken0 = await ExoMockToken0.totalSupply();
			const exoTotalSupplyToken1 = await ExoMockToken1.totalSupply();
			const uniTotalSupplyToken0 = await UniMockToken0.totalSupply();
			const uniTotalSupplyToken1 = await UniMockToken1.totalSupply();

			expect(await ExoMockToken0.balanceOf(Alice.address)).to.eq(exoTotalSupplyToken0.sub(token0Amount).add(expectedOutputAmount));
			expect(await UniMockToken0.balanceOf(Alice.address)).to.eq(uniTotalSupplyToken0.sub(token0Amount).add(expectedOutputAmount));

			expect(await ExoMockToken1.balanceOf(Alice.address)).to.eq(exoTotalSupplyToken1.sub(token1Amount).sub(swapAmount));
			expect(await UniMockToken1.balanceOf(Alice.address)).to.eq(uniTotalSupplyToken1.sub(token1Amount).sub(swapAmount));
		});

		it("swap:gas @skip-on-coverage", async () =>
		{
			const token0Amount = ExpandTo18Decimals(5);
			const token1Amount = ExpandTo18Decimals(10);
			await addLiquidity(token0Amount, token1Amount);

			// ensure that setting price{0,1}CumulativeLast for the first time doesn't affect our gas math
			await AdvanceBlock();

			await ExofiswapPair().sync();
			await UniswapV2Pair().sync();

			const swapAmount = ExpandTo18Decimals(1);
			const expectedOutputAmount = BigNumber.from("453305446940074565");

			await ExoMockToken1.transfer(ExofiswapPair().address, swapAmount);
			await UniMockToken1.transfer(UniswapV2Pair().address, swapAmount);

			await AdvanceBlock();

			const exoTx = await ExofiswapPair().swap(expectedOutputAmount, 0, Alice.address, "0x");
			const exoReceipt = await exoTx.wait();
			expect(exoReceipt.gasUsed).to.eq(69523);

			const uniTx = await UniswapV2Pair().swap(expectedOutputAmount, 0, Alice.address, "0x");
			const uniReceipt = await uniTx.wait();
			// expect(receipt.gasUsed).to.eq(73462);
			expect(uniReceipt.gasUsed).to.eq(73349);
		});

		it("burn", async () =>
		{
			const token0Amount = ExpandTo18Decimals(3);
			const token1Amount = ExpandTo18Decimals(3);
			await addLiquidity(token0Amount, token1Amount);
			const expectedLiquidity = ExpandTo18Decimals(3);

			await ExofiswapPair().transfer(ExofiswapPair().address, expectedLiquidity.sub(MINIMUM_LIQUIDITY));
			await expect(ExofiswapPair().burn(Alice.address))
				.to.emit(ExofiswapPair(), "Transfer")
				.withArgs(ExofiswapPair().address, ADDRESS_ZERO, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
				.to.emit(ExoMockToken0, "Transfer")
				.withArgs(ExofiswapPair().address, Alice.address, token0Amount.sub(1000))
				.to.emit(ExoMockToken1, "Transfer")
				.withArgs(ExofiswapPair().address, Alice.address, token1Amount.sub(1000))
				.to.emit(ExofiswapPair(), "Sync")
				.withArgs(1000, 1000)
				.to.emit(ExofiswapPair(), "Burn")
				.withArgs(Alice.address, token0Amount.sub(1000), token1Amount.sub(1000), Alice.address);

			expect(await ExofiswapPair().balanceOf(Alice.address)).to.eq(0);
			expect(await ExofiswapPair().totalSupply()).to.eq(MINIMUM_LIQUIDITY);
			expect(await ExoMockToken0.balanceOf(ExofiswapPair().address)).to.eq(1000);
			expect(await ExoMockToken1.balanceOf(ExofiswapPair().address)).to.eq(1000);
			const exoTotalSupplyToken0 = await ExoMockToken0.totalSupply();
			const exoTotalSupplyToken1 = await ExoMockToken1.totalSupply();
			expect(await ExoMockToken0.balanceOf(Alice.address)).to.eq(exoTotalSupplyToken0.sub(1000));
			expect(await ExoMockToken1.balanceOf(Alice.address)).to.eq(exoTotalSupplyToken1.sub(1000));

			await UniswapV2Pair().transfer(UniswapV2Pair().address, expectedLiquidity.sub(MINIMUM_LIQUIDITY));
			await expect(UniswapV2Pair().burn(Alice.address))
				.to.emit(UniswapV2Pair(), "Transfer")
				.withArgs(UniswapV2Pair().address, ADDRESS_ZERO, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
				.to.emit(UniMockToken0, "Transfer")
				.withArgs(UniswapV2Pair().address, Alice.address, token0Amount.sub(1000))
				.to.emit(UniMockToken1, "Transfer")
				.withArgs(UniswapV2Pair().address, Alice.address, token1Amount.sub(1000))
				.to.emit(UniswapV2Pair(), "Sync")
				.withArgs(1000, 1000)
				.to.emit(UniswapV2Pair(), "Burn")
				.withArgs(Alice.address, token0Amount.sub(1000), token1Amount.sub(1000), Alice.address);

			expect(await UniswapV2Pair().balanceOf(Alice.address)).to.eq(0);
			expect(await UniswapV2Pair().totalSupply()).to.eq(MINIMUM_LIQUIDITY);
			expect(await UniMockToken0.balanceOf(UniswapV2Pair().address)).to.eq(1000);
			expect(await UniMockToken1.balanceOf(UniswapV2Pair().address)).to.eq(1000);
			const uniTotalSupplyToken0 = await UniMockToken0.totalSupply();
			const uniTotalSupplyToken1 = await UniMockToken1.totalSupply();
			expect(await UniMockToken0.balanceOf(Alice.address)).to.eq(uniTotalSupplyToken0.sub(1000));
			expect(await UniMockToken1.balanceOf(Alice.address)).to.eq(uniTotalSupplyToken1.sub(1000));
		});

		it("price{0,1}CumulativeLast", async () =>
		{
			const token0Amount = ExpandTo18Decimals(3);
			const token1Amount = ExpandTo18Decimals(3);
			await StopAutomine();
			await addLiquidity(token0Amount, token1Amount);
			await AdvanceBlock();

			const uniBlockTimestamp = (await UniswapV2Pair().getReserves())[2];
			const exoBlockTimestamp = (await ExofiswapPair().getReserves())[2];
			expect(uniBlockTimestamp).to.eq(exoBlockTimestamp);

			await network.provider.send("evm_setNextBlockTimestamp", [exoBlockTimestamp + 1]);
			await UniswapV2Pair().sync();
			await ExofiswapPair().sync();
			await AdvanceBlock();

			const uniInitialPrice = EncodePrice(token0Amount, token1Amount);
			expect(await UniswapV2Pair().price0CumulativeLast()).to.eq(uniInitialPrice[0]);
			expect(await UniswapV2Pair().price1CumulativeLast()).to.eq(uniInitialPrice[1]);
			expect((await UniswapV2Pair().getReserves())[2]).to.eq(uniBlockTimestamp + 1);

			const exoInitialPrice = EncodePrice(token0Amount, token1Amount);
			expect(await ExofiswapPair().price0CumulativeLast()).to.eq(exoInitialPrice[0]);
			expect(await ExofiswapPair().price1CumulativeLast()).to.eq(exoInitialPrice[1]);
			expect((await ExofiswapPair().getReserves())[2]).to.eq(exoBlockTimestamp + 1);

			const uniSwapAmount = ExpandTo18Decimals(3);
			await UniMockToken0.transfer(UniswapV2Pair().address, uniSwapAmount);
			const exoSwapAmount = ExpandTo18Decimals(3);
			await ExoMockToken0.transfer(ExofiswapPair().address, exoSwapAmount);

			await network.provider.send("evm_setNextBlockTimestamp", [exoBlockTimestamp + 10]);
			// swap to a new price eagerly instead of syncing
			await UniswapV2Pair().swap(0, ExpandTo18Decimals(1), Alice.address, "0x"); // make the price nice
			await ExofiswapPair().swap(0, ExpandTo18Decimals(1), Alice.address, "0x"); // make the price nice
			await AdvanceBlock();

			expect(await UniswapV2Pair().price0CumulativeLast()).to.eq(uniInitialPrice[0].mul(10));
			expect(await UniswapV2Pair().price1CumulativeLast()).to.eq(uniInitialPrice[1].mul(10));
			expect((await UniswapV2Pair().getReserves())[2]).to.eq(uniBlockTimestamp + 10);
			expect(await ExofiswapPair().price0CumulativeLast()).to.eq(exoInitialPrice[0].mul(10));
			expect(await ExofiswapPair().price1CumulativeLast()).to.eq(exoInitialPrice[1].mul(10));
			expect((await ExofiswapPair().getReserves())[2]).to.eq(exoBlockTimestamp + 10);

			await network.provider.send("evm_setNextBlockTimestamp", [exoBlockTimestamp + 20]);
			await UniswapV2Pair().sync();
			await ExofiswapPair().sync();
			await AdvanceBlock();

			const uniNewPrice = EncodePrice(ExpandTo18Decimals(6), ExpandTo18Decimals(2));
			expect(await UniswapV2Pair().price0CumulativeLast()).to.eq(uniInitialPrice[0].mul(10).add(uniNewPrice[0].mul(10)));
			expect(await UniswapV2Pair().price1CumulativeLast()).to.eq(uniInitialPrice[1].mul(10).add(uniNewPrice[1].mul(10)));
			expect((await UniswapV2Pair().getReserves())[2]).to.eq(uniBlockTimestamp + 20);
			const exoNewPrice = EncodePrice(ExpandTo18Decimals(6), ExpandTo18Decimals(2));
			expect(await ExofiswapPair().price0CumulativeLast()).to.eq(exoInitialPrice[0].mul(10).add(exoNewPrice[0].mul(10)));
			expect(await ExofiswapPair().price1CumulativeLast()).to.eq(exoInitialPrice[1].mul(10).add(exoNewPrice[1].mul(10)));
			expect((await ExofiswapPair().getReserves())[2]).to.eq(exoBlockTimestamp + 20);
			await StartAutomine();
		});

		it("feeTo:off", async () =>
		{
			const token0Amount = ExpandTo18Decimals(1000);
			const token1Amount = ExpandTo18Decimals(1000);

			await addLiquidity(token0Amount, token1Amount);
			const swapAmount = ExpandTo18Decimals(1);
			const expectedOutputAmount = BigNumber.from("996006981039903216");
			const expectedLiquidity = ExpandTo18Decimals(1000);

			await UniMockToken1.transfer(UniswapV2Pair().address, swapAmount);
			await UniswapV2Pair().swap(expectedOutputAmount, 0, Alice.address, "0x");
			await UniswapV2Pair().transfer(UniswapV2Pair().address, expectedLiquidity.sub(MINIMUM_LIQUIDITY));
			await UniswapV2Pair().burn(Alice.address);
			expect(await UniswapV2Pair().totalSupply()).to.eq(MINIMUM_LIQUIDITY);

			await ExoMockToken1.transfer(ExofiswapPair().address, swapAmount);
			await ExofiswapPair().swap(expectedOutputAmount, 0, Alice.address, "0x");
			await ExofiswapPair().transfer(ExofiswapPair().address, expectedLiquidity.sub(MINIMUM_LIQUIDITY));
			await ExofiswapPair().burn(Alice.address);
			expect(await ExofiswapPair().totalSupply()).to.eq(MINIMUM_LIQUIDITY);
		});

		it("feeTo:on", async () =>
		{
			await UniswapV2Factory.setFeeTo(Bob.address);
			await ExofiswapFactory.setFeeTo(Bob.address);

			const token0Amount = ExpandTo18Decimals(1000);
			const token1Amount = ExpandTo18Decimals(1000);
			await addLiquidity(token0Amount, token1Amount);
			const swapAmount = ExpandTo18Decimals(1);
			const expectedOutputAmount = BigNumber.from("996006981039903216");
			const expectedLiquidity = ExpandTo18Decimals(1000);

			await UniMockToken1.transfer(UniswapV2Pair().address, swapAmount);
			await UniswapV2Pair().swap(expectedOutputAmount, 0, Alice.address, "0x");
			await UniswapV2Pair().transfer(UniswapV2Pair().address, expectedLiquidity.sub(MINIMUM_LIQUIDITY));
			await UniswapV2Pair().burn(Alice.address);
			expect(await UniswapV2Pair().totalSupply()).to.eq(BigNumber.from(MINIMUM_LIQUIDITY).add("249750499251388"));
			expect(await UniswapV2Pair().balanceOf(Bob.address)).to.eq("249750499251388");
			// using 1000 here instead of the symbolic MINIMUM_LIQUIDITY because the amounts only happen to be equal...
			// ...because the initial liquidity amounts were equal
			expect(await UniMockToken0.balanceOf(UniswapV2Pair().address)).to.eq(BigNumber.from(1000).add("249501683697445"));
			expect(await UniMockToken1.balanceOf(UniswapV2Pair().address)).to.eq(BigNumber.from(1000).add("250000187312969"));

			await ExoMockToken1.transfer(ExofiswapPair().address, swapAmount);
			await ExofiswapPair().swap(expectedOutputAmount, 0, Alice.address, "0x");
			await ExofiswapPair().transfer(ExofiswapPair().address, expectedLiquidity.sub(MINIMUM_LIQUIDITY));
			await ExofiswapPair().burn(Alice.address);
			expect(await ExofiswapPair().totalSupply()).to.eq(BigNumber.from(MINIMUM_LIQUIDITY).add("249750499251388"));
			expect(await ExofiswapPair().balanceOf(Bob.address)).to.eq("249750499251388");
			// using 1000 here instead of the symbolic MINIMUM_LIQUIDITY because the amounts only happen to be equal...
			// ...because the initial liquidity amounts were equal
			expect(await ExoMockToken0.balanceOf(ExofiswapPair().address)).to.eq(BigNumber.from(1000).add("249501683697445"));
			expect(await ExoMockToken1.balanceOf(ExofiswapPair().address)).to.eq(BigNumber.from(1000).add("250000187312969"));
		});
	});
});
