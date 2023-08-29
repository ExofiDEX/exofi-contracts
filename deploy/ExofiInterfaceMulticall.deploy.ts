import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { UnifiedDeploy } from "../scripts/DeployHelper";

const contract = "ExofiInterfaceMulticall";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	await UnifiedDeploy(hre, contract);
};

export default func;

func.id = `Deploy_${contract}`;
func.tags = [ contract ];