import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallTransferOwnership, CreatePair, GetDeployedContracts } from "../scripts/DeployHelper";
import { GetTokenAddress } from "../scripts/DeployConstants";

const contract = "ExofiswapFactory";
const fermionContract = "Fermion";
const contractDependencies =
	[
		contract, `${contract}_Init`,
		fermionContract, `${fermionContract}_Init`
	];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	const { dev } = await hre.getNamedAccounts();

	await CallTransferOwnership(hre, contract, dev);

	const tokens = await GetTokenAddress();
	const pairExofiNative = await CreatePair(hre, contract, dependencies[fermionContract].address, "EXOFI", tokens.nativeToken, "NATIVE");
	const pairExofiUsdc = await CreatePair(hre, contract, dependencies[fermionContract].address, "EXOFI", tokens.usdc, "USDC");
	const pairExofiUsdt = await CreatePair(hre, contract, dependencies[fermionContract].address, "EXOFI", tokens.usdt, "USDT");
	const pairExofiDai = await CreatePair(hre, contract, dependencies[fermionContract].address, "EXOFI", tokens.dai, "DAI");

	console.log("ExofiswapFactory - EXOFI/NATIVE Pair address used: ", pairExofiNative);
	console.log("ExofiswapFactory - EXOFI/USDC Pair address used: ", pairExofiUsdc);
	console.log("ExofiswapFactory - EXOFI/USDT Pair address used: ", pairExofiUsdt);
	console.log("ExofiswapFactory - EXOFI/DAI Pair address used: ", pairExofiDai);
};

export default func;

func.id = `Deploy_${contract}_Config`; // id required to prevent reexecution
func.tags = [`${contract}_Config`];
func.dependencies = [...contractDependencies];
