import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { BigNumber } from "ethers";
import { CallAdd, CallSetStore, CallTransferOwnership, GetAllPairs, GetAllPairsLength, GetDeployedContracts, GetPoolLength } from "../scripts/DeployHelper";

const contract = "MagneticFieldGenerator";
const mfgsContract = "MagneticFieldGeneratorStore";
const fermionContract = "Fermion";
const exofiswapFactory = "ExofiswapFactory";
const contractDependencies =
	[
		contract, `${contract}_Init`,
		mfgsContract, `${mfgsContract}_Init`,
		`${mfgsContract}_Config`, // Owner of store needs to be set
		fermionContract, `${fermionContract}_Init`,
		exofiswapFactory, `${exofiswapFactory}_Init`
	];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	const { dev } = await hre.getNamedAccounts();

	await CallTransferOwnership(hre, contract, dev);

	await CallSetStore(hre, contract, dependencies[mfgsContract].address, dev);

	let lockPeriod: BigNumber = BigNumber.from(0);
	/* eslint-disable indent */
	switch (process.env.NETWORK)
	{
		case "main":
			lockPeriod = BigNumber.from(216000);
			break;
		case "goerli":
		case "base_main":
		case "base_goerli":
			break;
		default:
			throw new Error("Unknown Network");
	}
	/* eslint-enable indent */

	const mfgPools = (await GetPoolLength(hre, contract)).toNumber();
	if (mfgPools < 5)
	{
		if (mfgPools < 1)
		{
			await CallAdd(hre, contract, BigNumber.from(300), dependencies[fermionContract].address, lockPeriod, dev);
		}

		const pairsCount = (await GetAllPairsLength(hre, exofiswapFactory)).toNumber();
		let alloc = 300; // EXOFI/WETH is the first Pair and gehts a bit more allocPoints

		for (let i = 0; i < pairsCount && i < 4; ++i)
		{
			if(i >= mfgPools-1)
			{
				const pair = await GetAllPairs(hre, exofiswapFactory, i);
				await CallAdd(hre, contract, BigNumber.from(alloc), pair, lockPeriod, dev);
			}
			alloc = 200;
		}
	}

	// If needed something like that...
	// const uniMig = await ethers.getContract("UniMigrator");
	// if (await mfg.migrator() !== uniMig.address)
	// {
	// // Set Migrator to UniMigrator
	// console.log("Set Migrator of MagneticFieldGenerator to UniMigrator");
	// await (await mfg.connect(dep).setMigrator(uniMig.address)).wait();
	// }
};

export default func;

func.id = `Deploy_${contract}_Config`; // id required to prevent reexecution
func.tags = [`${contract}_Config`];
func.dependencies = [...contractDependencies];