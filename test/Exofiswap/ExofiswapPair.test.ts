import { ethers, network } from "hardhat";
import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ADDRESS_ZERO, AdvanceBlock, EncodePrice, ExpandTo18Decimals, StartAutomine, StopAutomine } from "../helpers";
import { IERC20Metadata, IExofiswapFactory, IExofiswapPair } from "../../typechain-types";

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
		let MockTokenFactory: ContractFactory;
		let ExoContract: Contract;
		let ExoMockToken0: IERC20Metadata;
		let ExoMockToken1: IERC20Metadata;
		let ExofiswapFactory: IExofiswapFactory;
		const ExofiswapPair = () => ExoContract as IExofiswapPair;

		beforeEach(async () =>
		{
			MockTokenFactory = await ethers.getContractFactory("ERC20Mock");
			ExoMockToken0 = (await MockTokenFactory.deploy("MockToken0", "MKT0", ExpandTo18Decimals(1000000000))) as IERC20Metadata;
			await ExoMockToken0.deployed();
			ExoMockToken1 = (await MockTokenFactory.deploy("MockToken1", "MKT1", ExpandTo18Decimals(1000000000))) as IERC20Metadata;
			await ExoMockToken1.deployed();

			if (ExoMockToken0.address > ExoMockToken1.address)
			{
				const help = ExoMockToken1;
				ExoMockToken1 = ExoMockToken0;
				ExoMockToken0 = help;
			}

			ExofiswapFactoryFactory = await ethers.getContractFactory("ExofiswapFactory");
			ExofiswapFactory = (await ExofiswapFactoryFactory.deploy()) as IExofiswapFactory;
			await ExofiswapFactory.deployed();

			const exoTransaction = await ExofiswapFactory.createPair(ExoMockToken0.address, ExoMockToken1.address);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const exoReceipt: any = await exoTransaction.wait();
			const exoAddress = exoReceipt.events[0].decode(exoReceipt.events[0].data).pair;
			ExoContract = await ethers.getContractAt("ExofiswapPair", exoAddress);
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
		});

		it("mint", async () =>
		{
			const token0Amount = ExpandTo18Decimals(1);
			const token1Amount = ExpandTo18Decimals(4);

			await ExoMockToken0.transfer(ExoContract.address, token0Amount);
			await ExoMockToken1.transfer(ExoContract.address, token1Amount);

			const expectedLiquidity = ExpandTo18Decimals(2);

			await expect(ExofiswapPair().mint(Alice.address))
				.to.emit(ExoContract, "Transfer").withArgs(ADDRESS_ZERO, ADDRESS_ZERO, MINIMUM_LIQUIDITY)
				.to.emit(ExoContract, "Transfer").withArgs(ADDRESS_ZERO, Alice.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
				.to.emit(ExoContract, "Sync").withArgs(token0Amount, token1Amount)
				.to.emit(ExoContract, "Mint").withArgs(Alice.address, token0Amount, token1Amount);

			expect(await ExofiswapPair().totalSupply()).to.eq(expectedLiquidity);

			expect(await ExofiswapPair().balanceOf(Alice.address)).to.eq(expectedLiquidity.sub(MINIMUM_LIQUIDITY));

			expect(await ExoMockToken0.balanceOf(ExofiswapPair().address)).to.eq(token0Amount);

			expect(await ExoMockToken1.balanceOf(ExofiswapPair().address)).to.eq(token1Amount);

			const exoReserves = await ExofiswapPair().getReserves();

			expect(exoReserves[0]).to.eq(token0Amount);

			expect(exoReserves[1]).to.eq(token1Amount);
		});

		async function addLiquidity(token0Amount: BigNumber, token1Amount: BigNumber)
		{
			await ExoMockToken0.transfer(ExofiswapPair().address, token0Amount);

			await ExoMockToken1.transfer(ExofiswapPair().address, token1Amount);

			await ExofiswapPair().mint(Alice.address);
		}

		it("swap:token1", async () =>
		{
			const token0Amount = ExpandTo18Decimals(5);
			const token1Amount = ExpandTo18Decimals(10);
			await addLiquidity(token0Amount, token1Amount);
			expect(await ExoMockToken0.balanceOf(ExoContract.address)).is.eq(token0Amount);
			expect(await ExoMockToken1.balanceOf(ExoContract.address)).is.eq(token1Amount);

			const swapAmount = ExpandTo18Decimals(1);
			const expectedOutputAmount = BigNumber.from("1662497915624478906");

			await ExoMockToken0.transfer(ExofiswapPair().address, swapAmount);

			await expect(ExofiswapPair().swap(0, expectedOutputAmount, Alice.address, "0x"))
				.to.emit(ExoMockToken1, "Transfer").withArgs(ExofiswapPair().address, Alice.address, expectedOutputAmount)
				.to.emit(ExofiswapPair(), "Sync").withArgs(token0Amount.add(swapAmount), token1Amount.sub(expectedOutputAmount))
				.to.emit(ExofiswapPair(), "Swap").withArgs(Alice.address, swapAmount, 0, 0, expectedOutputAmount, Alice.address);

			const exoReserves = await ExofiswapPair().getReserves();

			expect(exoReserves[0]).to.eq(token0Amount.add(swapAmount));

			expect(exoReserves[1]).to.eq(token1Amount.sub(expectedOutputAmount));

			expect(await ExoMockToken0.balanceOf(ExofiswapPair().address)).to.eq(token0Amount.add(swapAmount));

			expect(await ExoMockToken1.balanceOf(ExofiswapPair().address)).to.eq(token1Amount.sub(expectedOutputAmount));

			const exoTotalSupplyToken0 = await ExoMockToken0.totalSupply();
			const exoTotalSupplyToken1 = await ExoMockToken1.totalSupply();

			expect(await ExoMockToken0.balanceOf(Alice.address)).to.eq(exoTotalSupplyToken0.sub(token0Amount).sub(swapAmount));

			expect(await ExoMockToken1.balanceOf(Alice.address)).to.eq(exoTotalSupplyToken1.sub(token1Amount).add(expectedOutputAmount));
		});

		it("swap:token0", async () =>
		{
			const token0Amount = ExpandTo18Decimals(5);
			const token1Amount = ExpandTo18Decimals(10);
			await addLiquidity(token0Amount, token1Amount);

			const swapAmount = ExpandTo18Decimals(1);
			const expectedOutputAmount = BigNumber.from("453305446940074565");

			await ExoMockToken1.transfer(ExofiswapPair().address, swapAmount);

			await expect(ExofiswapPair().swap(expectedOutputAmount, 0, Alice.address, "0x"))
				.to.emit(ExoMockToken0, "Transfer").withArgs(ExofiswapPair().address, Alice.address, expectedOutputAmount)
				.to.emit(ExofiswapPair(), "Sync").withArgs(token0Amount.sub(expectedOutputAmount), token1Amount.add(swapAmount))
				.to.emit(ExofiswapPair(), "Swap").withArgs(Alice.address, 0, swapAmount, expectedOutputAmount, 0, Alice.address);

			const exoReserves = await ExofiswapPair().getReserves();

			expect(exoReserves[0]).to.eq(token0Amount.sub(expectedOutputAmount));

			expect(exoReserves[1]).to.eq(token1Amount.add(swapAmount));

			expect(await ExoMockToken0.balanceOf(ExofiswapPair().address)).to.eq(token0Amount.sub(expectedOutputAmount));

			expect(await ExoMockToken1.balanceOf(ExofiswapPair().address)).to.eq(token1Amount.add(swapAmount));

			const exoTotalSupplyToken0 = await ExoMockToken0.totalSupply();
			const exoTotalSupplyToken1 = await ExoMockToken1.totalSupply();

			expect(await ExoMockToken0.balanceOf(Alice.address)).to.eq(exoTotalSupplyToken0.sub(token0Amount).add(expectedOutputAmount));

			expect(await ExoMockToken1.balanceOf(Alice.address)).to.eq(exoTotalSupplyToken1.sub(token1Amount).sub(swapAmount));
		});

		it("swap:gas @skip-on-coverage", async () =>
		{
			const token0Amount = ExpandTo18Decimals(5);
			const token1Amount = ExpandTo18Decimals(10);
			await addLiquidity(token0Amount, token1Amount);

			// ensure that setting price{0,1}CumulativeLast for the first time doesn't affect our gas math
			await AdvanceBlock();

			await ExofiswapPair().sync();

			const swapAmount = ExpandTo18Decimals(1);
			const expectedOutputAmount = BigNumber.from("453305446940074565");

			await ExoMockToken1.transfer(ExofiswapPair().address, swapAmount);

			await AdvanceBlock();

			const exoTx = await ExofiswapPair().swap(expectedOutputAmount, 0, Alice.address, "0x");
			const exoReceipt = await exoTx.wait();
			expect(exoReceipt.gasUsed).to.lessThanOrEqual(74026);
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
		});

		it("price{0,1}CumulativeLast", async () =>
		{
			const token0Amount = ExpandTo18Decimals(3);
			const token1Amount = ExpandTo18Decimals(3);
			await StopAutomine();
			await addLiquidity(token0Amount, token1Amount);
			await AdvanceBlock();

			const exoBlockTimestamp = (await ExofiswapPair().getReserves())[2];

			await network.provider.send("evm_setNextBlockTimestamp", [exoBlockTimestamp + 1]);
			await ExofiswapPair().sync();
			await AdvanceBlock();

			const exoInitialPrice = EncodePrice(token0Amount, token1Amount);
			expect(await ExofiswapPair().price0CumulativeLast()).to.eq(exoInitialPrice[0]);
			expect(await ExofiswapPair().price1CumulativeLast()).to.eq(exoInitialPrice[1]);
			expect((await ExofiswapPair().getReserves())[2]).to.eq(exoBlockTimestamp + 1);

			const exoSwapAmount = ExpandTo18Decimals(3);
			await ExoMockToken0.transfer(ExofiswapPair().address, exoSwapAmount);

			await network.provider.send("evm_setNextBlockTimestamp", [exoBlockTimestamp + 10]);
			// swap to a new price eagerly instead of syncing
			await ExofiswapPair().swap(0, ExpandTo18Decimals(1), Alice.address, "0x"); // make the price nice
			await AdvanceBlock();

			expect(await ExofiswapPair().price0CumulativeLast()).to.eq(exoInitialPrice[0].mul(10));
			expect(await ExofiswapPair().price1CumulativeLast()).to.eq(exoInitialPrice[1].mul(10));
			expect((await ExofiswapPair().getReserves())[2]).to.eq(exoBlockTimestamp + 10);

			await network.provider.send("evm_setNextBlockTimestamp", [exoBlockTimestamp + 20]);
			await ExofiswapPair().sync();
			await AdvanceBlock();

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

			await ExoMockToken1.transfer(ExofiswapPair().address, swapAmount);
			await ExofiswapPair().swap(expectedOutputAmount, 0, Alice.address, "0x");
			await ExofiswapPair().transfer(ExofiswapPair().address, expectedLiquidity.sub(MINIMUM_LIQUIDITY));
			await ExofiswapPair().burn(Alice.address);
			expect(await ExofiswapPair().totalSupply()).to.eq(MINIMUM_LIQUIDITY);
		});

		it("feeTo:on", async () =>
		{
			await ExofiswapFactory.setFeeTo(Bob.address);

			const token0Amount = ExpandTo18Decimals(1000);
			const token1Amount = ExpandTo18Decimals(1000);
			await addLiquidity(token0Amount, token1Amount);
			const swapAmount = ExpandTo18Decimals(1);
			const expectedOutputAmount = BigNumber.from("996006981039903216");
			const expectedLiquidity = ExpandTo18Decimals(1000);

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
