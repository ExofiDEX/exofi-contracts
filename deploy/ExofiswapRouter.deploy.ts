import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetTokenAddress } from "../scripts/DeployConstants";
import { GetDeployedContracts, UnifiedDeploy } from "../scripts/DeployHelper";

const contract = "ExofiswapRouter";
const exofiswapFactory = "ExofiswapFactory";
const contractDependencies = [exofiswapFactory];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const wethAddress = (await GetTokenAddress()).nativeToken;
	const dependencies = await GetDeployedContracts(hre, contractDependencies);

	const constructorParameters = [dependencies[exofiswapFactory].address, wethAddress];
	await UnifiedDeploy(hre, contract, constructorParameters);
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract];
func.dependencies = [...contractDependencies];
