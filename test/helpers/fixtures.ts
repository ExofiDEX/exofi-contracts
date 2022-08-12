/* eslint-disable node/no-unpublished-import */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { ethers } from "hardhat";
import { IERC20Metadata, IExofiswapFactory, IExofiswapPair, IExofiswapRouter } from "../../typechain-types";
import { ExpandTo18Decimals } from "./utilities";

interface IFixture
{
	exoMockToken0: IERC20Metadata
	exoMockToken1: IERC20Metadata
	uniMockToken0: Contract
	uniMockToken1: Contract
	WETH: Contract
	exoWETHPartner: IERC20Metadata
	uniWETHPartner: Contract
	// factoryV1: Contract
	exoFactory: IExofiswapFactory
	uniFactoryV2: Contract
	// router01: Contract
	exoRouter: IExofiswapRouter
	uniRouter02: Contract
	routerEventEmitter: Contract
	// router: Contract
	// migrator: Contract
	// WETHExchangeV1: Contract
	exoPair: IExofiswapPair
	uniPair: Contract
	exoWETHPair: IExofiswapPair
	uniWETHPair: Contract
}

export async function Fixture(wallet: SignerWithAddress): Promise<IFixture>
{
	const WETHFactory = await ethers.getContractFactory("WETH9");
	const WETH = await WETHFactory.deploy();
	await WETH.deployed();

	const routerEventEmitterFactory = await ethers.getContractFactory("RouterEventEmitter");
	const routerEventEmitter = await routerEventEmitterFactory.deploy();
	await routerEventEmitter.deployed();

	const mockTokenFactory = await ethers.getContractFactory("ERC20Mock");

	let uniMockToken0 = (await mockTokenFactory.deploy("UniMockToken0", "MKT0", ExpandTo18Decimals(10000))) as IERC20Metadata;
	await uniMockToken0.deployed();
	let uniMockToken1 = (await mockTokenFactory.deploy("UniMockToken1", "MKT1", ExpandTo18Decimals(10000))) as IERC20Metadata;
	await uniMockToken1.deployed();
	if (uniMockToken1.address < uniMockToken0.address)
	{
		const help = uniMockToken0;
		uniMockToken0 = uniMockToken1;
		uniMockToken1 = help;
	}

	const uniWETHPartner = (await mockTokenFactory.deploy("UniMockToken WETH Partner", "uniWP", ExpandTo18Decimals(10000))) as IERC20Metadata;
	await uniWETHPartner.deployed();

	const uniFactoryV2Factory = await ethers.getContractFactory("UniswapV2Factory");
	const uniFactoryV2 = await uniFactoryV2Factory.deploy(wallet.address);
	await uniFactoryV2.deployed();
	// console.log(await uniFactoryV2.pairCodeHash());

	const uniRouter02Factory = await ethers.getContractFactory("UniswapV2Router02");
	const uniRouter02 = await uniRouter02Factory.deploy(uniFactoryV2.address, WETH.address);
	await uniRouter02.deployed();

	await uniFactoryV2.createPair(uniMockToken0.address, uniMockToken1.address);
	const uniPairAddress = await uniFactoryV2.getPair(uniMockToken0.address, uniMockToken1.address);
	const uniPair = await ethers.getContractAt("UniswapV2Pair", uniPairAddress);

	await uniFactoryV2.createPair(WETH.address, uniWETHPartner.address);
	const uniWETHPairAddress = await uniFactoryV2.getPair(WETH.address, uniWETHPartner.address);
	const uniWETHPair = (await ethers.getContractAt("ExofiswapPair", uniWETHPairAddress)) as IExofiswapPair;

	let exoMockToken0 = (await mockTokenFactory.deploy("ExoMockToken0", "MKT0", ExpandTo18Decimals(10000))) as IERC20Metadata;
	await exoMockToken0.deployed();
	let exoMockToken1 = (await mockTokenFactory.deploy("ExoMockToken1", "MKT1", ExpandTo18Decimals(10000))) as IERC20Metadata;
	await exoMockToken1.deployed();
	if (exoMockToken1.address < exoMockToken0.address)
	{
		const help = exoMockToken0;
		exoMockToken0 = exoMockToken1;
		exoMockToken1 = help;
	}

	const exoWETHPartner = (await mockTokenFactory.deploy("ExoMockToken WETH Partner", "exoWP", ExpandTo18Decimals(10000))) as IERC20Metadata;
	await exoWETHPartner.deployed();

	const exoFactoryFactory = await ethers.getContractFactory("ExofiswapFactory");
	const exoFactory = (await exoFactoryFactory.deploy()) as IExofiswapFactory;
	await exoFactory.deployed();
	await exoFactory.transferOwnership(wallet.address);

	const exoRouterFactory = await ethers.getContractFactory("ExofiswapRouter");
	const exoRouter = (await exoRouterFactory.deploy(exoFactory.address, WETH.address)) as IExofiswapRouter;
	await exoRouter.deployed();

	await exoFactory.createPair(exoMockToken0.address, exoMockToken1.address);
	const exoPairAddress = await exoFactory.getPair(exoMockToken0.address, exoMockToken1.address);
	const exoPair = (await ethers.getContractAt("ExofiswapPair", exoPairAddress)) as IExofiswapPair;

	await exoFactory.createPair(WETH.address, exoWETHPartner.address);
	const exoWETHPairAddress = await exoFactory.getPair(WETH.address, exoWETHPartner.address);
	const exoWETHPair = (await ethers.getContractAt("ExofiswapPair", exoWETHPairAddress)) as IExofiswapPair;

	return {
		exoMockToken0,
		exoMockToken1,
		uniMockToken0,
		uniMockToken1,
		WETH,
		exoWETHPartner,
		uniWETHPartner,
		exoFactory,
		uniFactoryV2,
		exoRouter,
		uniRouter02,
		routerEventEmitter,
		exoPair,
		uniPair,
		exoWETHPair,
		uniWETHPair
	};
}
