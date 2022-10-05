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
	WETH: Contract
	exoWETHPartner: IERC20Metadata
	// factoryV1: Contract
	exoFactory: IExofiswapFactory
	// router01: Contract
	exoRouter: IExofiswapRouter
	routerEventEmitter: Contract
	// router: Contract
	// migrator: Contract
	// WETHExchangeV1: Contract
	exoPair: IExofiswapPair
	exoWETHPair: IExofiswapPair
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
		WETH,
		exoWETHPartner,
		exoFactory,
		exoRouter,
		routerEventEmitter,
		exoPair,
		exoWETHPair
	};
}
