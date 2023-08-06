import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallPairCodeHash, UnifiedDeploy } from "../scripts/DeployHelper";

const contract = "ExofiswapFactory";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	await UnifiedDeploy(hre, contract);

	const exprectedPairCodeHash = "0x249895517e40838f4b1dd16d4fcf91c721a6326947a6f8535e3ad8f94a649f81";
	const actualPairCodeHash = await CallPairCodeHash(hre, contract);

	console.log("ExofiswapFactory - Verify Pair creation code hash: ", exprectedPairCodeHash);
	if (exprectedPairCodeHash !== actualPairCodeHash)
	{
		console.log("ExofiswapFactory - Pair creation code hash has unexpected value of: ", actualPairCodeHash);
		throw new Error("Pair creation code hash mismatch!");
	}
	else
	{
		console.log("ExofiswapFactory - Pair creation code hash verified");
	}
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract];