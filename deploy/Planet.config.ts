import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallTransferOwnership, GetDeployedContracts } from "../scripts/DeployHelper";

const contract = "Planet";
const mfgContract = "MagneticFieldGenerator";
const contractDependencies =
	[
		contract, `${contract}_Init`,
		mfgContract, `${mfgContract}_Init`
	];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	await CallTransferOwnership(hre, contract, dependencies[mfgContract].address);
};

export default func;

func.id = `Deploy_${contract}_Config`; // id required to prevent reexecution
func.tags = [`${contract}_Config`];
func.dependencies = [...contractDependencies];