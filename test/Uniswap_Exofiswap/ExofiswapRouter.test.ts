/* eslint-disable node/no-unpublished-import */
import { ethers } from "hardhat";
import { expect } from "chai";
import { BigNumber, Contract } from "ethers";

import { IERC20Metadata, IExofiswapFactory, IExofiswapPair, IExofiswapRouter } from "../../typechain-types";
import { Fixture } from "../helpers/fixtures";
import { ADDRESS_ZERO, ExpandTo18Decimals, GetApprovalDigest, MAX_UINT256, MINIMUM_LIQUIDITY } from "../helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// import { keccak256 } from "ethereumjs-util";
import { ecsign } from "ethereumjs-util";

describe("ExofiswapRouter", () =>
{
	let Signers: SignerWithAddress[];
	let WalletSigner: SignerWithAddress;

	let uniMockToken0: Contract;
	let uniMockToken1: Contract;
	let uniRouter: Contract;
	let uniPair: Contract;
	let exoMockToken0: IERC20Metadata;
	let exoMockToken1: IERC20Metadata;
	let exoRouter: IExofiswapRouter;
	let exoPair: IExofiswapPair;

	beforeEach(async () =>
	{
		Signers = await ethers.getSigners();
		WalletSigner = Signers[0];
		const fixture = await Fixture(WalletSigner);
		uniMockToken0 = fixture.uniMockToken0;
		uniMockToken1 = fixture.uniMockToken1;
		uniRouter = fixture.uniRouter02;
		uniPair = fixture.uniPair;

		exoMockToken0 = fixture.exoMockToken0;
		exoMockToken1 = fixture.exoMockToken1;
		exoRouter = fixture.exoRouter;
		exoPair = fixture.exoPair;
	});

	it("quote", async () =>
	{
		expect(await uniRouter.quote(BigNumber.from(1), BigNumber.from(100), BigNumber.from(200))).to.eq(BigNumber.from(2));
		expect(await uniRouter.quote(BigNumber.from(2), BigNumber.from(200), BigNumber.from(100))).to.eq(BigNumber.from(1));
		await expect(uniRouter.quote(BigNumber.from(0), BigNumber.from(100), BigNumber.from(200))).to.be
			.revertedWith("UniswapV2Library: INSUFFICIENT_AMOUNT");
		await expect(uniRouter.quote(BigNumber.from(1), BigNumber.from(0), BigNumber.from(200))).to.be
			.revertedWith("UniswapV2Library: INSUFFICIENT_LIQUIDITY");
		await expect(uniRouter.quote(BigNumber.from(1), BigNumber.from(100), BigNumber.from(0))).to.be
			.revertedWith("UniswapV2Library: INSUFFICIENT_LIQUIDITY");

		expect(await exoRouter.quote(BigNumber.from(1), BigNumber.from(100), BigNumber.from(200))).to.eq(BigNumber.from(2));
		expect(await exoRouter.quote(BigNumber.from(2), BigNumber.from(200), BigNumber.from(100))).to.eq(BigNumber.from(1));
		await expect(exoRouter.quote(BigNumber.from(0), BigNumber.from(100), BigNumber.from(200))).to.be
			.revertedWith("EL: INSUFFICIENT_AMOUNT");
		await expect(exoRouter.quote(BigNumber.from(1), BigNumber.from(0), BigNumber.from(200))).to.be
			.revertedWith("EL: INSUFFICIENT_LIQUIDITY");
		await expect(exoRouter.quote(BigNumber.from(1), BigNumber.from(100), BigNumber.from(0))).to.be
			.revertedWith("EL: INSUFFICIENT_LIQUIDITY");
	});

	it("getAmountOut", async () =>
	{
		expect(await uniRouter.getAmountOut(BigNumber.from(2), BigNumber.from(100), BigNumber.from(100))).to.eq(BigNumber.from(1));
		await expect(uniRouter.getAmountOut(BigNumber.from(0), BigNumber.from(100), BigNumber.from(100))).to.be
			.revertedWith("UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT");
		await expect(uniRouter.getAmountOut(BigNumber.from(2), BigNumber.from(0), BigNumber.from(100))).to.be
			.revertedWith("UniswapV2Library: INSUFFICIENT_LIQUIDITY");
		await expect(uniRouter.getAmountOut(BigNumber.from(2), BigNumber.from(100), BigNumber.from(0))).to.be
			.revertedWith("UniswapV2Library: INSUFFICIENT_LIQUIDITY");

		expect(await exoRouter.getAmountOut(BigNumber.from(2), BigNumber.from(100), BigNumber.from(100))).to.eq(BigNumber.from(1));
		await expect(exoRouter.getAmountOut(BigNumber.from(0), BigNumber.from(100), BigNumber.from(100))).to.be
			.revertedWith("EL: INSUFFICIENT_INPUT_AMOUNT");
		await expect(exoRouter.getAmountOut(BigNumber.from(2), BigNumber.from(0), BigNumber.from(100))).to.be
			.revertedWith("EL: INSUFFICIENT_LIQUIDITY");
		await expect(exoRouter.getAmountOut(BigNumber.from(2), BigNumber.from(100), BigNumber.from(0))).to.be
			.revertedWith("EL: INSUFFICIENT_LIQUIDITY");
	});

	it("getAmountIn", async () =>
	{
		expect(await uniRouter.getAmountIn(BigNumber.from(1), BigNumber.from(100), BigNumber.from(100))).to.eq(BigNumber.from(2));
		await expect(uniRouter.getAmountIn(BigNumber.from(0), BigNumber.from(100), BigNumber.from(100))).to.be
			.revertedWith("UniswapV2Library: INSUFFICIENT_OUTPUT_AMOUNT");
		await expect(uniRouter.getAmountIn(BigNumber.from(1), BigNumber.from(0), BigNumber.from(100))).to.be
			.revertedWith("UniswapV2Library: INSUFFICIENT_LIQUIDITY");
		await expect(uniRouter.getAmountIn(BigNumber.from(1), BigNumber.from(100), BigNumber.from(0))).to.be
			.revertedWith("UniswapV2Library: INSUFFICIENT_LIQUIDITY");

		expect(await exoRouter.getAmountIn(BigNumber.from(1), BigNumber.from(100), BigNumber.from(100))).to.eq(BigNumber.from(2));
		await expect(exoRouter.getAmountIn(BigNumber.from(0), BigNumber.from(100), BigNumber.from(100))).to.be
			.revertedWith("EL: INSUFFICIENT_OUTPUT_AMOUNT");
		await expect(exoRouter.getAmountIn(BigNumber.from(1), BigNumber.from(0), BigNumber.from(100))).to.be
			.revertedWith("EL: INSUFFICIENT_LIQUIDITY");
		await expect(exoRouter.getAmountIn(BigNumber.from(1), BigNumber.from(100), BigNumber.from(0))).to.be
			.revertedWith("EL: INSUFFICIENT_LIQUIDITY");
	});

	it("getAmountsOut", async () =>
	{
		await uniMockToken0.approve(uniRouter.address, MAX_UINT256);
		await uniMockToken1.approve(uniRouter.address, MAX_UINT256);
		await uniRouter.addLiquidity(
			uniMockToken0.address,
			uniMockToken1.address,
			BigNumber.from(10000),
			BigNumber.from(10000),
			0,
			0,
			WalletSigner.address,
			MAX_UINT256);

		await expect(uniRouter.getAmountsOut(BigNumber.from(2), [uniMockToken0.address])).to.be.revertedWith("UniswapV2Library: INVALID_PATH");
		const uniPath = [uniMockToken0.address, uniMockToken1.address];
		expect(await uniRouter.getAmountsOut(BigNumber.from(2), uniPath)).to.deep.eq([BigNumber.from(2), BigNumber.from(1)]);

		await exoMockToken0.approve(exoRouter.address, MAX_UINT256);
		await exoMockToken1.approve(exoRouter.address, MAX_UINT256);
		await exoRouter.addLiquidity(
			exoMockToken0.address,
			exoMockToken1.address,
			BigNumber.from(10000),
			BigNumber.from(10000),
			0,
			0,
			WalletSigner.address,
			MAX_UINT256);

		await expect(exoRouter.getAmountsOut(BigNumber.from(2), [exoMockToken0.address])).to.be.revertedWith("EL: INVALID_PATH");
		const exoPath = [exoMockToken0.address, exoMockToken1.address];
		expect(await exoRouter.getAmountsOut(BigNumber.from(2), exoPath)).to.deep.eq([BigNumber.from(2), BigNumber.from(1)]);
	});

	it("getAmountsIn", async () =>
	{
		await uniMockToken0.approve(uniRouter.address, MAX_UINT256);
		await uniMockToken1.approve(uniRouter.address, MAX_UINT256);
		await uniRouter.addLiquidity(
			uniMockToken0.address,
			uniMockToken1.address,
			BigNumber.from(10000),
			BigNumber.from(10000),
			0,
			0,
			WalletSigner.address,
			MAX_UINT256
		);

		await expect(uniRouter.getAmountsIn(BigNumber.from(1), [uniMockToken0.address])).to.be
			.revertedWith("UniswapV2Library: INVALID_PATH");
		const uniPath = [uniMockToken0.address, uniMockToken1.address];
		expect(await uniRouter.getAmountsIn(BigNumber.from(1), uniPath)).to.deep.eq([BigNumber.from(2), BigNumber.from(1)]);

		await exoMockToken0.approve(exoRouter.address, MAX_UINT256);
		await exoMockToken1.approve(exoRouter.address, MAX_UINT256);
		await exoRouter.addLiquidity(
			exoMockToken0.address,
			exoMockToken1.address,
			BigNumber.from(10000),
			BigNumber.from(10000),
			0,
			0,
			WalletSigner.address,
			MAX_UINT256
		);

		await expect(exoRouter.getAmountsIn(BigNumber.from(1), [exoMockToken0.address])).to.be
			.revertedWith("EL: INVALID_PATH");
		const exoPath = [exoMockToken0.address, exoMockToken1.address];
		expect(await exoRouter.getAmountsIn(BigNumber.from(1), exoPath)).to.deep.eq([BigNumber.from(2), BigNumber.from(1)]);
	});

	describe("fee-on-transfer tokens", () =>
	{
		let DTT: Contract;
		let WETH: Contract;

		beforeEach(async () =>
		{
			Signers = await ethers.getSigners();
			WalletSigner = Signers[0];
			const fixture = await Fixture(WalletSigner);
			WETH = fixture.WETH;

			const DTTFactory = await ethers.getContractFactory("DeflatingERC20");
			DTT = await DTTFactory.deploy(ExpandTo18Decimals(10000));
			await DTT.deployed();

			uniRouter = fixture.uniRouter02;
			// make a DTT<>WETH pair
			await fixture.uniFactoryV2.createPair(DTT.address, WETH.address);
			const uniPairAddress = await fixture.uniFactoryV2.getPair(DTT.address, WETH.address);
			uniPair = await ethers.getContractAt("UniswapV2Pair", uniPairAddress);
			uniPair.deployed();

			exoRouter = fixture.exoRouter;
			// make a DTT<>WETH pair
			await fixture.exoFactory.createPair(DTT.address, WETH.address);
			const exoPairAddress = await fixture.exoFactory.getPair(DTT.address, WETH.address);
			exoPair = (await ethers.getContractAt("ExofiswapPair", exoPairAddress)) as IExofiswapPair;
			exoPair.deployed();
		});

		afterEach(async function ()
		{
			// expect(await uniPair.balanceOf(uniRouter.address)).to.eq(0);
			// expect(await exoPair.balanceOf(exoRouter.address)).to.eq(0);
			expect(await uniRouter.provider.getBalance(uniRouter.address)).to.eq(0);
			expect(await exoRouter.provider.getBalance(exoRouter.address)).to.eq(0);
		});

		async function addLiquidity(DTTAmount: BigNumber, WETHAmount: BigNumber)
		{
			await DTT.approve(uniRouter.address, MAX_UINT256);
			await uniRouter.addLiquidityETH(DTT.address, DTTAmount, DTTAmount, WETHAmount, WalletSigner.address, MAX_UINT256, { value: WETHAmount });

			await DTT.approve(exoRouter.address, MAX_UINT256);
			await exoRouter.addLiquidityETH(DTT.address, DTTAmount, DTTAmount, WETHAmount, WalletSigner.address, MAX_UINT256, { value: WETHAmount });
		}

		it("removeLiquidityETHSupportingFeeOnTransferTokens", async () =>
		{
			const DTTAmount = ExpandTo18Decimals(1);
			const ETHAmount = ExpandTo18Decimals(4);
			await addLiquidity(DTTAmount, ETHAmount);

			const uniDTTInPair = await DTT.balanceOf(uniPair.address);
			const uniWETHInPair = await WETH.balanceOf(uniPair.address);
			const uniLiquidity = await uniPair.balanceOf(WalletSigner.address);
			const uniTotalSupply = await uniPair.totalSupply();
			const uniNaiveDTTExpected = uniDTTInPair.mul(uniLiquidity).div(uniTotalSupply);
			const uniWETHExpected = uniWETHInPair.mul(uniLiquidity).div(uniTotalSupply);

			await uniPair.approve(uniRouter.address, MAX_UINT256);
			await uniRouter.removeLiquidityETHSupportingFeeOnTransferTokens(
				DTT.address,
				uniLiquidity,
				uniNaiveDTTExpected,
				uniWETHExpected,
				WalletSigner.address,
				MAX_UINT256
			);

			const exoDTTInPair = await DTT.balanceOf(exoPair.address);
			const exoWETHInPair = await WETH.balanceOf(exoPair.address);
			const exoLiquidity = await exoPair.balanceOf(WalletSigner.address);
			const exoTotalSupply = await exoPair.totalSupply();
			const exoNaiveDTTExpected = exoDTTInPair.mul(exoLiquidity).div(exoTotalSupply);
			const exoWETHExpected = exoWETHInPair.mul(exoLiquidity).div(exoTotalSupply);

			await exoPair.approve(exoRouter.address, MAX_UINT256);
			await exoRouter.removeLiquidityETHSupportingFeeOnTransferTokens(
				DTT.address,
				exoLiquidity,
				exoNaiveDTTExpected,
				exoWETHExpected,
				WalletSigner.address,
				MAX_UINT256
			);
		});

		it("removeLiquidityETHWithPermitSupportingFeeOnTransferTokens", async () =>
		{
			const DTTAmount = ExpandTo18Decimals(1).mul(100).div(99);
			const ETHAmount = ExpandTo18Decimals(4);
			await addLiquidity(DTTAmount, ETHAmount);
			const expectedLiquidity = ExpandTo18Decimals(2);

			// Has to match the one in hardhat.config.ts otherwise the test will fail.
			const mnemonic = process.env.MNEMONIC || "test test test test test test test test test test test junk";
			const wallet = ethers.Wallet.fromMnemonic(mnemonic);
			// Enforces that the private key is in fact the one of WalletSigner.
			expect(wallet.address).to.equal(WalletSigner.address);

			const uniNonce = await uniPair.nonces(WalletSigner.address);
			const uniDigest = await GetApprovalDigest(
				uniPair,
				{ owner: WalletSigner.address, spender: uniRouter.address, value: expectedLiquidity.sub(MINIMUM_LIQUIDITY) },
				uniNonce,
				MAX_UINT256
			);

			const { v: uniV, r: uniR, s: uniS } = ecsign(Buffer.from(uniDigest.slice(2), "hex"), Buffer.from(wallet.privateKey.slice(2), "hex"));
			const uniDTTInPair = await DTT.balanceOf(uniPair.address);
			const uniWETHInPair = await WETH.balanceOf(uniPair.address);
			const uniLiquidity = await uniPair.balanceOf(WalletSigner.address);
			const uniTotalSupply = await uniPair.totalSupply();
			const uniNaiveDTTExpected = uniDTTInPair.mul(uniLiquidity).div(uniTotalSupply);
			const uniWETHExpected = uniWETHInPair.mul(uniLiquidity).div(uniTotalSupply);

			await uniPair.approve(uniRouter.address, MAX_UINT256);
			await uniRouter.removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
				DTT.address,
				uniLiquidity,
				uniNaiveDTTExpected,
				uniWETHExpected,
				WalletSigner.address,
				MAX_UINT256,
				false,
				uniV,
				uniR,
				uniS
			);

			const exoNonce = await exoPair.nonces(WalletSigner.address);
			const exoDigest = await GetApprovalDigest(
				exoPair,
				{ owner: WalletSigner.address, spender: exoRouter.address, value: expectedLiquidity.sub(MINIMUM_LIQUIDITY) },
				exoNonce,
				MAX_UINT256
			);

			const { v: exoV, r: exoR, s: exoS } = ecsign(Buffer.from(exoDigest.slice(2), "hex"), Buffer.from(wallet.privateKey.slice(2), "hex"));
			const exoDTTInPair = await DTT.balanceOf(exoPair.address);
			const exoWETHInPair = await WETH.balanceOf(exoPair.address);
			const exoLiquidity = await exoPair.balanceOf(WalletSigner.address);
			const exoTotalSupply = await exoPair.totalSupply();
			const exoNaiveDTTExpected = exoDTTInPair.mul(exoLiquidity).div(exoTotalSupply);
			const exoWETHExpected = exoWETHInPair.mul(exoLiquidity).div(exoTotalSupply);

			await exoPair.approve(exoRouter.address, MAX_UINT256);
			await exoRouter.removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
				DTT.address,
				exoLiquidity,
				exoNaiveDTTExpected,
				exoWETHExpected,
				WalletSigner.address,
				MAX_UINT256,
				false,
				exoV,
				exoR,
				exoS
			);
		});

		describe("swapExactTokensForTokensSupportingFeeOnTransferTokens", () =>
		{
			const DTTAmount = ExpandTo18Decimals(5).mul(100).div(99);
			const ETHAmount = ExpandTo18Decimals(10);
			const amountIn = ExpandTo18Decimals(1);

			beforeEach(async () =>
			{
				Signers = await ethers.getSigners();
				WalletSigner = Signers[0];
				const fixture = await Fixture(WalletSigner);
				WETH = fixture.WETH;

				const DTTFactory = await ethers.getContractFactory("DeflatingERC20");
				DTT = await DTTFactory.deploy(ExpandTo18Decimals(10000));
				await DTT.deployed();

				uniRouter = fixture.uniRouter02;
				// make a DTT<>WETH pair
				await fixture.uniFactoryV2.createPair(DTT.address, WETH.address);
				const uniPairAddress = await fixture.uniFactoryV2.getPair(DTT.address, WETH.address);
				uniPair = await ethers.getContractAt("UniswapV2Pair", uniPairAddress);
				uniPair.deployed();

				exoRouter = fixture.exoRouter;
				// make a DTT<>WETH pair
				await fixture.exoFactory.createPair(DTT.address, WETH.address);
				const exoPairAddress = await fixture.exoFactory.getPair(DTT.address, WETH.address);
				exoPair = (await ethers.getContractAt("ExofiswapPair", exoPairAddress)) as IExofiswapPair;
				exoPair.deployed();

				await addLiquidity(DTTAmount, ETHAmount);
			});

			it("DTT -> WETH", async () =>
			{
				await DTT.approve(uniRouter.address, MAX_UINT256);

				await uniRouter.swapExactTokensForTokensSupportingFeeOnTransferTokens(
					amountIn,
					0,
					[DTT.address, WETH.address],
					WalletSigner.address,
					MAX_UINT256
				);

				await DTT.approve(exoRouter.address, MAX_UINT256);

				await exoRouter.swapExactTokensForTokensSupportingFeeOnTransferTokens(
					amountIn,
					0,
					[DTT.address, WETH.address],
					WalletSigner.address,
					MAX_UINT256
				);
			});

			// WETH -> DTT
			it("WETH -> DTT", async () =>
			{
				await WETH.deposit({ value: amountIn }); // mint WETH
				await WETH.approve(exoRouter.address, MAX_UINT256);

				await exoRouter.swapExactTokensForTokensSupportingFeeOnTransferTokens(
					amountIn,
					0,
					[WETH.address, DTT.address],
					WalletSigner.address,
					MAX_UINT256
				);
			});
		});

		// ETH -> DTT
		it("swapExactETHForTokensSupportingFeeOnTransferTokens", async () =>
		{
			const DTTAmount = ExpandTo18Decimals(10).mul(100).div(99);
			const ETHAmount = ExpandTo18Decimals(5);
			const swapAmount = ExpandTo18Decimals(1);
			await addLiquidity(DTTAmount, ETHAmount);

			await uniRouter.swapExactETHForTokensSupportingFeeOnTransferTokens(
				0,
				[WETH.address, DTT.address],
				WalletSigner.address,
				MAX_UINT256,
				{ value: swapAmount }
			);

			await exoRouter.swapExactETHForTokensSupportingFeeOnTransferTokens(
				0,
				[WETH.address, DTT.address],
				WalletSigner.address,
				MAX_UINT256,
				{ value: swapAmount }
			);
		});

		// DTT -> ETH
		it("swapExactTokensForETHSupportingFeeOnTransferTokens", async () =>
		{
			const DTTAmount = ExpandTo18Decimals(5).mul(100).div(99);
			const ETHAmount = ExpandTo18Decimals(10);
			const swapAmount = ExpandTo18Decimals(1);

			await addLiquidity(DTTAmount, ETHAmount);

			await DTT.approve(uniRouter.address, MAX_UINT256);
			await uniRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(
				swapAmount,
				0,
				[DTT.address, WETH.address],
				WalletSigner.address,
				MAX_UINT256
			);

			await DTT.approve(exoRouter.address, MAX_UINT256);
			await exoRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(
				swapAmount,
				0,
				[DTT.address, WETH.address],
				WalletSigner.address,
				MAX_UINT256
			);
		});
	});

	describe("fee-on-transfer tokens: reloaded", () =>
	{
		let DTT: Contract;
		let DTT2: Contract;

		beforeEach(async function ()
		{
			Signers = await ethers.getSigners();
			WalletSigner = Signers[0];
			const fixture = await Fixture(WalletSigner);

			const DTTFactory = await ethers.getContractFactory("DeflatingERC20");
			DTT = await DTTFactory.deploy(ExpandTo18Decimals(10000));
			await DTT.deployed();

			DTT2 = await DTTFactory.deploy(ExpandTo18Decimals(10000));
			await DTT2.deployed();

			uniRouter = fixture.uniRouter02;
			// make a DTT<>DTT2 pair
			await fixture.uniFactoryV2.createPair(DTT.address, DTT2.address);
			const uniPairAddress = await fixture.uniFactoryV2.getPair(DTT.address, DTT2.address);
			uniPair = await ethers.getContractAt("UniswapV2Pair", uniPairAddress);
			uniPair.deployed();

			exoRouter = fixture.exoRouter;
			// make a DTT<>DTT2 pair
			await fixture.exoFactory.createPair(DTT.address, DTT2.address);
			const exoPairAddress = await fixture.exoFactory.getPair(DTT.address, DTT2.address);
			exoPair = (await ethers.getContractAt("ExofiswapPair", exoPairAddress)) as IExofiswapPair;
			exoPair.deployed();
		});

		afterEach(async function ()
		{
			// expect(await uniPair.balanceOf(uniRouter.address)).to.eq(0);
			// expect(await exoPair.balanceOf(exoRouter.address)).to.eq(0);
			expect(await uniRouter.provider.getBalance(uniRouter.address)).to.eq(0);
			expect(await exoRouter.provider.getBalance(exoRouter.address)).to.eq(0);
		});

		async function addLiquidity(DTTAmount: BigNumber, DTT2Amount: BigNumber)
		{
			await DTT.approve(uniRouter.address, MAX_UINT256);
			await DTT2.approve(uniRouter.address, MAX_UINT256);
			await uniRouter.addLiquidity(
				DTT.address,
				DTT2.address,
				DTTAmount,
				DTT2Amount,
				DTTAmount,
				DTT2Amount,
				WalletSigner.address,
				MAX_UINT256
			);

			await DTT.approve(exoRouter.address, MAX_UINT256);
			await DTT2.approve(exoRouter.address, MAX_UINT256);
			await exoRouter.addLiquidity(
				DTT.address,
				DTT2.address,
				DTTAmount,
				DTT2Amount,
				DTTAmount,
				DTT2Amount,
				WalletSigner.address,
				MAX_UINT256
			);
		}

		describe("swapExactTokensForTokensSupportingFeeOnTransferTokens", () =>
		{
			const DTTAmount = ExpandTo18Decimals(5).mul(100).div(99);
			const DTT2Amount = ExpandTo18Decimals(5);
			const amountIn = ExpandTo18Decimals(1);

			beforeEach(async () =>
			{
				await addLiquidity(DTTAmount, DTT2Amount);
			});

			it("DTT -> DTT2", async () =>
			{
				await DTT.approve(uniRouter.address, MAX_UINT256);
				await uniRouter.swapExactTokensForTokensSupportingFeeOnTransferTokens(
					amountIn,
					0,
					[DTT.address, DTT2.address],
					WalletSigner.address,
					MAX_UINT256
				);

				await DTT.approve(exoRouter.address, MAX_UINT256);
				await exoRouter.swapExactTokensForTokensSupportingFeeOnTransferTokens(
					amountIn,
					0,
					[DTT.address, DTT2.address],
					WalletSigner.address,
					MAX_UINT256
				);
			});
		});
	});

	describe("UniswapV2Router01 functions", () =>
	{
		let WETH: Contract;
		let uniFactory: Contract;
		let uniWETHPartner: Contract;
		let uniWETHPair: Contract;
		let exoFactory: IExofiswapFactory;
		let exoWETHPartner: IERC20Metadata;
		let exoWETHPair: IExofiswapPair;
		let routerEventEmitter: Contract;

		beforeEach(async () =>
		{
			Signers = await ethers.getSigners();
			WalletSigner = Signers[0];
			const fixture = await Fixture(WalletSigner);
			WETH = fixture.WETH;
			routerEventEmitter = fixture.routerEventEmitter;

			uniMockToken0 = fixture.uniMockToken0;
			uniMockToken1 = fixture.uniMockToken1;
			uniRouter = fixture.uniRouter02;
			uniPair = fixture.uniPair;
			uniFactory = fixture.uniFactoryV2;
			uniWETHPartner = fixture.uniWETHPartner;
			uniWETHPair = fixture.uniWETHPair;

			exoMockToken0 = fixture.exoMockToken0;
			exoMockToken1 = fixture.exoMockToken1;
			exoRouter = fixture.exoRouter;
			exoPair = fixture.exoPair;
			exoFactory = fixture.exoFactory;
			exoWETHPartner = fixture.exoWETHPartner;
			exoWETHPair = fixture.exoWETHPair;
		});

		afterEach(async () =>
		{
			expect(await uniRouter.provider.getBalance(uniRouter.address)).to.eq(0);
			expect(await exoRouter.provider.getBalance(exoRouter.address)).to.eq(0);
		});

		it("factory, WETH", async () =>
		{
			expect(await uniRouter.factory()).to.eq(uniFactory.address);
			expect(await uniRouter.WETH()).to.eq(WETH.address);

			expect(await exoRouter.factory()).to.eq(exoFactory.address);
			expect(await exoRouter.WETH()).to.eq(WETH.address);
		});

		it("addLiquidity", async () =>
		{
			const token0Amount = ExpandTo18Decimals(1);
			const token1Amount = ExpandTo18Decimals(4);
			const expectedLiquidity = ExpandTo18Decimals(2);

			await uniMockToken0.approve(uniRouter.address, MAX_UINT256);
			await uniMockToken1.approve(uniRouter.address, MAX_UINT256);
			await expect(
				uniRouter.addLiquidity(
					uniMockToken0.address,
					uniMockToken1.address,
					token0Amount,
					token1Amount,
					0,
					0,
					WalletSigner.address,
					MAX_UINT256
				)
			)
				.to.emit(uniMockToken0, "Transfer")
				.withArgs(WalletSigner.address, uniPair.address, token0Amount)
				.to.emit(uniMockToken1, "Transfer")
				.withArgs(WalletSigner.address, uniPair.address, token1Amount)
				.to.emit(uniPair, "Transfer")
				.withArgs(ADDRESS_ZERO, ADDRESS_ZERO, MINIMUM_LIQUIDITY)
				.to.emit(uniPair, "Transfer")
				.withArgs(ADDRESS_ZERO, WalletSigner.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
				.to.emit(uniPair, "Sync")
				.withArgs(token0Amount, token1Amount)
				.to.emit(uniPair, "Mint")
				.withArgs(uniRouter.address, token0Amount, token1Amount);

			expect(await uniPair.balanceOf(WalletSigner.address)).to.eq(expectedLiquidity.sub(MINIMUM_LIQUIDITY));

			await exoMockToken0.approve(exoRouter.address, MAX_UINT256);
			await exoMockToken1.approve(exoRouter.address, MAX_UINT256);
			await expect(
				exoRouter.addLiquidity(
					exoMockToken0.address,
					exoMockToken1.address,
					token0Amount,
					token1Amount,
					0,
					0,
					WalletSigner.address,
					MAX_UINT256
				)
			)
				.to.emit(exoMockToken0, "Transfer")
				.withArgs(WalletSigner.address, exoPair.address, token0Amount)
				.to.emit(exoMockToken1, "Transfer")
				.withArgs(WalletSigner.address, exoPair.address, token1Amount)
				.to.emit(exoPair, "Transfer")
				.withArgs(ADDRESS_ZERO, ADDRESS_ZERO, MINIMUM_LIQUIDITY)
				.to.emit(exoPair, "Transfer")
				.withArgs(ADDRESS_ZERO, WalletSigner.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
				.to.emit(exoPair, "Sync")
				.withArgs(token0Amount, token1Amount)
				.to.emit(exoPair, "Mint")
				.withArgs(exoRouter.address, token0Amount, token1Amount);

			expect(await exoPair.balanceOf(WalletSigner.address)).to.eq(expectedLiquidity.sub(MINIMUM_LIQUIDITY));
		});

		it("addLiquidityETH", async () =>
		{
			const WETHPartnerAmount = ExpandTo18Decimals(1);
			const ETHAmount = ExpandTo18Decimals(4);
			const expectedLiquidity = ExpandTo18Decimals(2);

			const uniWETHPairToken0 = await uniWETHPair.token0();
			await uniWETHPartner.approve(uniRouter.address, MAX_UINT256);
			await expect(
				uniRouter.addLiquidityETH(
					uniWETHPartner.address,
					WETHPartnerAmount,
					WETHPartnerAmount,
					ETHAmount,
					WalletSigner.address,
					MAX_UINT256,
					{ value: ETHAmount }
				)
			)
				.to.emit(uniWETHPair, "Transfer")
				.withArgs(ADDRESS_ZERO, ADDRESS_ZERO, MINIMUM_LIQUIDITY)
				.to.emit(uniWETHPair, "Transfer")
				.withArgs(ADDRESS_ZERO, WalletSigner.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
				.to.emit(uniWETHPair, "Sync")
				.withArgs(
					uniWETHPairToken0 === uniWETHPartner.address ? WETHPartnerAmount : ETHAmount,
					uniWETHPairToken0 === uniWETHPartner.address ? ETHAmount : WETHPartnerAmount
				)
				.to.emit(uniWETHPair, "Mint")
				.withArgs(
					uniRouter.address,
					uniWETHPairToken0 === uniWETHPartner.address ? WETHPartnerAmount : ETHAmount,
					uniWETHPairToken0 === uniWETHPartner.address ? ETHAmount : WETHPartnerAmount
				);

			expect(await uniWETHPair.balanceOf(WalletSigner.address)).to.eq(expectedLiquidity.sub(MINIMUM_LIQUIDITY));

			const exoWETHPairToken0 = await exoWETHPair.token0();
			await exoWETHPartner.approve(exoRouter.address, MAX_UINT256);
			await expect(
				exoRouter.addLiquidityETH(
					exoWETHPartner.address,
					WETHPartnerAmount,
					WETHPartnerAmount,
					ETHAmount,
					WalletSigner.address,
					MAX_UINT256,
					{ value: ETHAmount }
				)
			)
				.to.emit(exoWETHPair, "Transfer")
				.withArgs(ADDRESS_ZERO, ADDRESS_ZERO, MINIMUM_LIQUIDITY)
				.to.emit(exoWETHPair, "Transfer")
				.withArgs(ADDRESS_ZERO, WalletSigner.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
				.to.emit(exoWETHPair, "Sync")
				.withArgs(
					exoWETHPairToken0 === exoWETHPartner.address ? WETHPartnerAmount : ETHAmount,
					exoWETHPairToken0 === exoWETHPartner.address ? ETHAmount : WETHPartnerAmount
				)
				.to.emit(exoWETHPair, "Mint")
				.withArgs(
					exoRouter.address,
					exoWETHPairToken0 === exoWETHPartner.address ? WETHPartnerAmount : ETHAmount,
					exoWETHPairToken0 === exoWETHPartner.address ? ETHAmount : WETHPartnerAmount
				);

			expect(await exoWETHPair.balanceOf(WalletSigner.address)).to.eq(expectedLiquidity.sub(MINIMUM_LIQUIDITY));
		});

		async function addLiquidity(token0Amount: BigNumber, token1Amount: BigNumber)
		{
			await uniMockToken0.transfer(uniPair.address, token0Amount);
			await uniMockToken1.transfer(uniPair.address, token1Amount);
			await uniPair.mint(WalletSigner.address);

			await exoMockToken0.transfer(exoPair.address, token0Amount);
			await exoMockToken1.transfer(exoPair.address, token1Amount);
			await exoPair.mint(WalletSigner.address);
		}

		it("removeLiquidity", async () =>
		{
			const token0Amount = ExpandTo18Decimals(1);
			const token1Amount = ExpandTo18Decimals(4);
			await addLiquidity(token0Amount, token1Amount);
			const expectedLiquidity = ExpandTo18Decimals(2);

			await uniPair.approve(uniRouter.address, MAX_UINT256);
			await expect(
				uniRouter.removeLiquidity(
					uniMockToken0.address,
					uniMockToken1.address,
					expectedLiquidity.sub(MINIMUM_LIQUIDITY),
					0,
					0,
					WalletSigner.address,
					MAX_UINT256
				)
			)
				.to.emit(uniPair, "Transfer")
				.withArgs(WalletSigner.address, uniPair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
				.to.emit(uniPair, "Transfer")
				.withArgs(uniPair.address, ADDRESS_ZERO, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
				.to.emit(uniMockToken0, "Transfer")
				.withArgs(uniPair.address, WalletSigner.address, token0Amount.sub(500))
				.to.emit(uniMockToken1, "Transfer")
				.withArgs(uniPair.address, WalletSigner.address, token1Amount.sub(2000))
				.to.emit(uniPair, "Sync")
				.withArgs(500, 2000)
				.to.emit(uniPair, "Burn")
				.withArgs(uniRouter.address, token0Amount.sub(500), token1Amount.sub(2000), WalletSigner.address);

			expect(await uniPair.balanceOf(WalletSigner.address)).to.eq(0);
			const uniTotalSupplyToken0 = await uniMockToken0.totalSupply();
			const uniTotalSupplyToken1 = await uniMockToken1.totalSupply();
			expect(await uniMockToken0.balanceOf(WalletSigner.address)).to.eq(uniTotalSupplyToken0.sub(500));
			expect(await uniMockToken1.balanceOf(WalletSigner.address)).to.eq(uniTotalSupplyToken1.sub(2000));

			await exoPair.approve(exoRouter.address, MAX_UINT256);
			await expect(
				exoRouter.removeLiquidity(
					exoMockToken0.address,
					exoMockToken1.address,
					expectedLiquidity.sub(MINIMUM_LIQUIDITY),
					0,
					0,
					WalletSigner.address,
					MAX_UINT256
				)
			)
				.to.emit(exoPair, "Transfer")
				.withArgs(WalletSigner.address, exoPair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
				.to.emit(exoPair, "Transfer")
				.withArgs(exoPair.address, ADDRESS_ZERO, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
				.to.emit(exoMockToken0, "Transfer")
				.withArgs(exoPair.address, WalletSigner.address, token0Amount.sub(500))
				.to.emit(exoMockToken1, "Transfer")
				.withArgs(exoPair.address, WalletSigner.address, token1Amount.sub(2000))
				.to.emit(exoPair, "Sync")
				.withArgs(500, 2000)
				.to.emit(exoPair, "Burn")
				.withArgs(exoRouter.address, token0Amount.sub(500), token1Amount.sub(2000), WalletSigner.address);

			expect(await exoPair.balanceOf(WalletSigner.address)).to.eq(0);
			const exoTotalSupplyToken0 = await exoMockToken0.totalSupply();
			const exoTotalSupplyToken1 = await exoMockToken1.totalSupply();
			expect(await exoMockToken0.balanceOf(WalletSigner.address)).to.eq(exoTotalSupplyToken0.sub(500));
			expect(await exoMockToken1.balanceOf(WalletSigner.address)).to.eq(exoTotalSupplyToken1.sub(2000));
		});

		it("uni removeLiquidityETH", async () =>
		{
			const WETHPartnerAmount = ExpandTo18Decimals(1);
			const ETHAmount = ExpandTo18Decimals(4);
			await uniWETHPartner.transfer(uniWETHPair.address, WETHPartnerAmount);
			await WETH.deposit({ value: ETHAmount });
			await WETH.transfer(uniWETHPair.address, ETHAmount);
			await uniWETHPair.mint(WalletSigner.address);

			const expectedLiquidity = ExpandTo18Decimals(2);
			const WETHPairToken0 = await uniWETHPair.token0();
			await uniWETHPair.approve(uniRouter.address, MAX_UINT256);
			await expect(
				uniRouter.removeLiquidityETH(
					uniWETHPartner.address,
					expectedLiquidity.sub(MINIMUM_LIQUIDITY),
					0,
					0,
					WalletSigner.address,
					MAX_UINT256
				)
			)
				.to.emit(uniWETHPair, "Transfer")
				.withArgs(WalletSigner.address, uniWETHPair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
				.to.emit(uniWETHPair, "Transfer")
				.withArgs(uniWETHPair.address, ADDRESS_ZERO, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
				.to.emit(WETH, "Transfer")
				.withArgs(uniWETHPair.address, uniRouter.address, ETHAmount.sub(2000))
				.to.emit(uniWETHPartner, "Transfer")
				.withArgs(uniWETHPair.address, uniRouter.address, WETHPartnerAmount.sub(500))
				.to.emit(uniWETHPartner, "Transfer")
				.withArgs(uniRouter.address, WalletSigner.address, WETHPartnerAmount.sub(500))
				.to.emit(uniWETHPair, "Sync")
				.withArgs(
					WETHPairToken0 === uniWETHPartner.address ? 500 : 2000,
					WETHPairToken0 === uniWETHPartner.address ? 2000 : 500
				)
				.to.emit(uniWETHPair, "Burn")
				.withArgs(
					uniRouter.address,
					WETHPairToken0 === uniWETHPartner.address ? WETHPartnerAmount.sub(500) : ETHAmount.sub(2000),
					WETHPairToken0 === uniWETHPartner.address ? ETHAmount.sub(2000) : WETHPartnerAmount.sub(500),
					uniRouter.address
				);

			expect(await uniWETHPair.balanceOf(WalletSigner.address)).to.eq(0);
			const totalSupplyWETHPartner = await uniWETHPartner.totalSupply();
			const totalSupplyWETH = await WETH.totalSupply();
			expect(await uniWETHPartner.balanceOf(WalletSigner.address)).to.eq(totalSupplyWETHPartner.sub(500));
			expect(await WETH.balanceOf(WalletSigner.address)).to.eq(totalSupplyWETH.sub(2000));
		});

		it("exo removeLiquidityETH", async () =>
		{
			const WETHPartnerAmount = ExpandTo18Decimals(1);
			const ETHAmount = ExpandTo18Decimals(4);
			await exoWETHPartner.transfer(exoWETHPair.address, WETHPartnerAmount);
			await WETH.deposit({ value: ETHAmount });
			await WETH.transfer(exoWETHPair.address, ETHAmount);
			await exoWETHPair.mint(WalletSigner.address);

			const expectedLiquidity = ExpandTo18Decimals(2);
			const WETHPairToken0 = await exoWETHPair.token0();
			await exoWETHPair.approve(exoRouter.address, MAX_UINT256);
			await expect(
				exoRouter.removeLiquidityETH(
					exoWETHPartner.address,
					expectedLiquidity.sub(MINIMUM_LIQUIDITY),
					0,
					0,
					WalletSigner.address,
					MAX_UINT256
				)
			)
				.to.emit(exoWETHPair, "Transfer")
				.withArgs(WalletSigner.address, exoWETHPair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
				.to.emit(exoWETHPair, "Transfer")
				.withArgs(exoWETHPair.address, ADDRESS_ZERO, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
				.to.emit(WETH, "Transfer")
				.withArgs(exoWETHPair.address, exoRouter.address, ETHAmount.sub(2000))
				.to.emit(exoWETHPartner, "Transfer")
				.withArgs(exoWETHPair.address, exoRouter.address, WETHPartnerAmount.sub(500))
				.to.emit(exoWETHPartner, "Transfer")
				.withArgs(exoRouter.address, WalletSigner.address, WETHPartnerAmount.sub(500))
				.to.emit(exoWETHPair, "Sync")
				.withArgs(
					WETHPairToken0 === exoWETHPartner.address ? 500 : 2000,
					WETHPairToken0 === exoWETHPartner.address ? 2000 : 500
				)
				.to.emit(exoWETHPair, "Burn")
				.withArgs(
					exoRouter.address,
					WETHPairToken0 === exoWETHPartner.address ? WETHPartnerAmount.sub(500) : ETHAmount.sub(2000),
					WETHPairToken0 === exoWETHPartner.address ? ETHAmount.sub(2000) : WETHPartnerAmount.sub(500),
					exoRouter.address
				);

			expect(await exoWETHPair.balanceOf(WalletSigner.address)).to.eq(0);
			const totalSupplyWETHPartner = await exoWETHPartner.totalSupply();
			const totalSupplyWETH = await WETH.totalSupply();
			expect(await exoWETHPartner.balanceOf(WalletSigner.address)).to.eq(totalSupplyWETHPartner.sub(500));
			expect(await WETH.balanceOf(WalletSigner.address)).to.eq(totalSupplyWETH.sub(2000));
		});

		it("removeLiquidityWithPermit", async () =>
		{
			const token0Amount = ExpandTo18Decimals(1);
			const token1Amount = ExpandTo18Decimals(4);
			await addLiquidity(token0Amount, token1Amount);
			const expectedLiquidity = ExpandTo18Decimals(2);
			// Has to match the one in hardhat.config.ts otherwise the test will fail.
			const mnemonic = process.env.MNEMONIC || "test test test test test test test test test test test junk";
			const wallet = ethers.Wallet.fromMnemonic(mnemonic);
			// Enforces that the private key is in fact the one of WalletSigner.
			expect(wallet.address).to.equal(WalletSigner.address);

			const uniNonce = await uniPair.nonces(WalletSigner.address);
			const uniDigest = await GetApprovalDigest(
				uniPair,
				{ owner: WalletSigner.address, spender: uniRouter.address, value: expectedLiquidity.sub(MINIMUM_LIQUIDITY) },
				uniNonce,
				MAX_UINT256
			);

			const { v: uniV, r: uniR, s: uniS } = ecsign(Buffer.from(uniDigest.slice(2), "hex"), Buffer.from(wallet.privateKey.slice(2), "hex"));

			await uniRouter.removeLiquidityWithPermit(
				uniMockToken0.address,
				uniMockToken1.address,
				expectedLiquidity.sub(MINIMUM_LIQUIDITY),
				0,
				0,
				WalletSigner.address,
				MAX_UINT256,
				false,
				uniV,
				uniR,
				uniS
			);

			const exoNonce = await exoPair.nonces(WalletSigner.address);
			const exoDigest = await GetApprovalDigest(
				exoPair,
				{ owner: WalletSigner.address, spender: exoRouter.address, value: expectedLiquidity.sub(MINIMUM_LIQUIDITY) },
				exoNonce,
				MAX_UINT256
			);

			const { v: exoV, r: exoR, s: exoS } = ecsign(Buffer.from(exoDigest.slice(2), "hex"), Buffer.from(wallet.privateKey.slice(2), "hex"));

			await exoRouter.removeLiquidityWithPermit(
				exoMockToken0.address,
				exoMockToken1.address,
				expectedLiquidity.sub(MINIMUM_LIQUIDITY),
				0,
				0,
				WalletSigner.address,
				MAX_UINT256,
				false,
				exoV,
				exoR,
				exoS
			);
		});

		it("uni removeLiquidityETHWithPermit", async () =>
		{
			const WETHPartnerAmount = ExpandTo18Decimals(1);
			const ETHAmount = ExpandTo18Decimals(4);
			await uniWETHPartner.transfer(uniWETHPair.address, WETHPartnerAmount);
			await WETH.deposit({ value: ETHAmount });
			await WETH.transfer(uniWETHPair.address, ETHAmount);
			await uniWETHPair.mint(WalletSigner.address);
			const expectedLiquidity = ExpandTo18Decimals(2);

			// Has to match the one in hardhat.config.ts otherwise the test will fail.
			const mnemonic = process.env.MNEMONIC || "test test test test test test test test test test test junk";
			const wallet = ethers.Wallet.fromMnemonic(mnemonic);
			// Enforces that the private key is in fact the one of WalletSigner.
			expect(wallet.address).to.equal(WalletSigner.address);

			const uniNonce = await uniWETHPair.nonces(WalletSigner.address);
			const uniDigest = await GetApprovalDigest(
				uniWETHPair,
				{ owner: WalletSigner.address, spender: uniRouter.address, value: expectedLiquidity.sub(MINIMUM_LIQUIDITY) },
				uniNonce,
				MAX_UINT256
			);

			const { v: uniV, r: uniR, s: uniS } = ecsign(Buffer.from(uniDigest.slice(2), "hex"), Buffer.from(wallet.privateKey.slice(2), "hex"));

			await uniRouter.removeLiquidityETHWithPermit(
				uniWETHPartner.address,
				expectedLiquidity.sub(MINIMUM_LIQUIDITY),
				0,
				0,
				WalletSigner.address,
				MAX_UINT256,
				false,
				uniV,
				uniR,
				uniS
			);
		});

		it("exo removeLiquidityETHWithPermit", async () =>
		{
			const WETHPartnerAmount = ExpandTo18Decimals(1);
			const ETHAmount = ExpandTo18Decimals(4);
			await exoWETHPartner.transfer(exoWETHPair.address, WETHPartnerAmount);
			await WETH.deposit({ value: ETHAmount });
			await WETH.transfer(exoWETHPair.address, ETHAmount);
			await exoWETHPair.mint(WalletSigner.address);
			const expectedLiquidity = ExpandTo18Decimals(2);

			// Has to match the one in hardhat.config.ts otherwise the test will fail.
			const mnemonic = process.env.MNEMONIC || "test test test test test test test test test test test junk";
			const wallet = ethers.Wallet.fromMnemonic(mnemonic);
			// Enforces that the private key is in fact the one of WalletSigner.
			expect(wallet.address).to.equal(WalletSigner.address);

			const exoNonce = await exoWETHPair.nonces(WalletSigner.address);
			const exoDigest = await GetApprovalDigest(
				exoWETHPair,
				{ owner: WalletSigner.address, spender: exoRouter.address, value: expectedLiquidity.sub(MINIMUM_LIQUIDITY) },
				exoNonce,
				MAX_UINT256
			);

			const { v: exoV, r: exoR, s: exoS } = ecsign(Buffer.from(exoDigest.slice(2), "hex"), Buffer.from(wallet.privateKey.slice(2), "hex"));

			await exoRouter.removeLiquidityETHWithPermit(
				exoWETHPartner.address,
				expectedLiquidity.sub(MINIMUM_LIQUIDITY),
				0,
				0,
				WalletSigner.address,
				MAX_UINT256,
				false,
				exoV,
				exoR,
				exoS
			);
		});

		describe("swapExactTokensForTokens", () =>
		{
			const token0Amount = ExpandTo18Decimals(5);
			const token1Amount = ExpandTo18Decimals(10);
			const swapAmount = ExpandTo18Decimals(1);
			const expectedOutputAmount = BigNumber.from("1662497915624478906");

			beforeEach(async () =>
			{
				await addLiquidity(token0Amount, token1Amount);
				await uniMockToken0.approve(uniRouter.address, MAX_UINT256);
				await exoMockToken0.approve(exoRouter.address, MAX_UINT256);
			});

			it("happy path", async () =>
			{
				await expect(
					uniRouter.swapExactTokensForTokens(
						swapAmount,
						0,
						[uniMockToken0.address, uniMockToken1.address],
						WalletSigner.address,
						MAX_UINT256
					)
				)
					.to.emit(uniMockToken0, "Transfer")
					.withArgs(WalletSigner.address, uniPair.address, swapAmount)
					.to.emit(uniMockToken1, "Transfer")
					.withArgs(uniPair.address, WalletSigner.address, expectedOutputAmount)
					.to.emit(uniPair, "Sync")
					.withArgs(token0Amount.add(swapAmount), token1Amount.sub(expectedOutputAmount))
					.to.emit(uniPair, "Swap")
					.withArgs(uniRouter.address, swapAmount, 0, 0, expectedOutputAmount, WalletSigner.address);

				await expect(
					exoRouter.swapExactTokensForTokens(
						swapAmount,
						0,
						[exoMockToken0.address, exoMockToken1.address],
						WalletSigner.address,
						MAX_UINT256
					)
				)
					.to.emit(exoMockToken0, "Transfer")
					.withArgs(WalletSigner.address, exoPair.address, swapAmount)
					.to.emit(exoMockToken1, "Transfer")
					.withArgs(exoPair.address, WalletSigner.address, expectedOutputAmount)
					.to.emit(exoPair, "Sync")
					.withArgs(token0Amount.add(swapAmount), token1Amount.sub(expectedOutputAmount))
					.to.emit(exoPair, "Swap")
					.withArgs(exoRouter.address, swapAmount, 0, 0, expectedOutputAmount, WalletSigner.address);
			});

			it("amounts", async () =>
			{
				await uniMockToken0.approve(routerEventEmitter.address, MAX_UINT256);
				await expect(
					routerEventEmitter.swapExactTokensForTokens(
						uniRouter.address,
						swapAmount,
						0,
						[uniMockToken0.address, uniMockToken1.address],
						WalletSigner.address,
						MAX_UINT256
					)
				)
					.to.emit(routerEventEmitter, "Amounts")
					.withArgs([swapAmount, expectedOutputAmount]);

				await exoMockToken0.approve(routerEventEmitter.address, MAX_UINT256);
				await expect(
					routerEventEmitter.swapExactTokensForTokens(
						exoRouter.address,
						swapAmount,
						0,
						[exoMockToken0.address, exoMockToken1.address],
						WalletSigner.address,
						MAX_UINT256
					)
				)
					.to.emit(routerEventEmitter, "Amounts")
					.withArgs([swapAmount, expectedOutputAmount]);
			});
		});
	});
});
