/* eslint-disable indent */
import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, UnifiedDeploy } from "../scripts/DeployHelper";

const contract = "MagneticFieldGenerator";
const fermionContract = "Fermion";
const planetContract = "Planet";
const contractDependencies = [fermionContract, planetContract];
const fermionPerBlock = "4000000000000000000"; // 4 Fermion

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);

	// eslint-disable-next-line no-undef
	let startBlock = "0";
	switch (process.env.NETWORK)
	{
		case "main": 
			startBlock = "15713777";
			break;
		case "goerli":
		case "base_main":
		case "base_goerli":
			startBlock = "0";
			break;
		default:
			throw new Error(`Unknown Network: ${process.env.NETWORK}`);
	}

	const constructorParameters = [dependencies[fermionContract].address, dependencies[planetContract].address, fermionPerBlock, startBlock];
	await UnifiedDeploy(hre, contract, constructorParameters);
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract];
func.dependencies = [...contractDependencies];
