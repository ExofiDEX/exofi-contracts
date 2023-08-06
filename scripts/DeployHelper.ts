import { ethers } from "hardhat";
import { Deployment } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment, Libraries } from "hardhat/types";
import { BigNumber } from "ethers";

export async function UnifiedDeploy(hre: HardhatRuntimeEnvironment, contract: string, constructorParameters?: unknown[], libraries?: Libraries): Promise<void>
{
	const { deployments, getNamedAccounts } = hre;
	const { deploy } = deployments;
	const { deployer } = await getNamedAccounts();
	console.log(`\x1B[32m${contract}\x1B[0m - Deploying contract with deployer \x1B[33m${deployer}\x1B[0m ...`);
	if(constructorParameters !== undefined)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Using constuctor parameters \x1B[33m${JSON.stringify(constructorParameters)}\x1B[0m ...`);
	}
	if(libraries !== undefined)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Using external libraries \x1B[33m${JSON.stringify(libraries)}\x1B[0m ...`);
	}
	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const result = await deploy(contract, { from: deployer, args: constructorParameters, log: false, contract: artifactName, libraries:libraries });
	console.log(`\x1B[32m${contract}\x1B[0m - ${result.newlyDeployed ? "✅ deployed to" : "reused at"} \x1B[32m${result.address}\x1B[0m`);
}

export async function UnifiedInitialize(hre: HardhatRuntimeEnvironment, contract: string, initParameters: unknown[], postInit?: (deployer: string) => Promise<void>): Promise<void>
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);
	const contractData = await deployments.get(contract);
	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const initContract = await ethers.getContractAt(artifactName, contractData.address);
	const isInitialized = await initContract.isInitialized();

	console.log(`\x1B[32m${contract}\x1B[0m - Initializing contract with account \x1B[33m${deployer}\x1B[0m ...`);
	if (!isInitialized)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Using init parameters \x1B[33m${JSON.stringify(initParameters)}\x1B[0m ...`);
		await (await initContract.connect(depSign).initialize(...initParameters)).wait();
		if(postInit !== undefined)
		{
			await postInit(deployer);
		}
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ initialized`);
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - already initialized`);
	}
}

export async function GetDeployedContracts(hre: HardhatRuntimeEnvironment, contracts: string[]): Promise<{ [index: string]: Deployment }>
{
	const { deployments } = hre;

	const map: { [index: string]: Deployment } = {};
	for (const item of contracts)
	{
		if (!item.endsWith("_Init") && !item.endsWith("_Config"))
			map[item] = await deployments.get(item);
	}

	return map;
}

export async function GetPoolLength(hre: HardhatRuntimeEnvironment, contract: string): Promise<BigNumber>
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const deploymentData = await deployments.get(contract);
	const contractData = await ethers.getContractAt(artifactName, deploymentData.address);

	console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.poolLength()\x1B[0m ...`);
	return await contractData.connect(depSign).poolLength();
}

export async function GetAllPairsLength(hre: HardhatRuntimeEnvironment, contract: string): Promise<BigNumber>
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const deploymentData = await deployments.get(contract);
	const contractData = await ethers.getContractAt(artifactName, deploymentData.address);

	console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.allPairsLength()\x1B[0m ...`);
	return await contractData.connect(depSign).allPairsLength();
}

export async function GetAllPairs(hre: HardhatRuntimeEnvironment, contract: string, arrayIndex: number): Promise<string>
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const deploymentData = await deployments.get(contract);
	const contractData = await ethers.getContractAt(artifactName, deploymentData.address);

	console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.allPairs(${arrayIndex})\x1B[0m ...`);
	return await contractData.connect(depSign).allPairs(arrayIndex);
}

export async function CallAdd(hre: HardhatRuntimeEnvironment, contract: string, alloc: BigNumber, pair: string, lockPeriod: BigNumber, owner: string): Promise<void>
{
	const { deployments } = hre;
	const depSign = await ethers.getSigner(owner);

	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const deploymentData = await deployments.get(contract);
	const contractData = await ethers.getContractAt(artifactName, deploymentData.address);

	console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.add(${alloc}, ${pair}, ${lockPeriod})\x1B[0m ...`);
	await (await contractData.connect(depSign).add(alloc, pair, lockPeriod)).wait(2);
}

export async function CallPairCodeHash(hre: HardhatRuntimeEnvironment, contract: string) : Promise<string>
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const deploymentData = await deployments.get(contract);
	const contractData = await ethers.getContractAt(artifactName, deploymentData.address);

	console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.pairCodeHash()\x1B[0m ...`);
	return await contractData.connect(depSign).pairCodeHash();
}

export async function CallSetStore(hre: HardhatRuntimeEnvironment, contract: string, storeContract: string, owner: string)
{
	const { deployments } = hre;
	const depSign = await ethers.getSigner(owner);

	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const deploymentData = await deployments.get(contract);
	const contractData = await ethers.getContractAt(artifactName, deploymentData.address);
	const currentStore = await contractData.getStore();
	if (currentStore !== storeContract)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setStore(${storeContract})\x1B[0m ...`);
		await (await contractData.connect(depSign).setStore(storeContract)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setStore(${storeContract})\x1B[0m ...`);
	}
}

export async function CallTransferOwnership(hre: HardhatRuntimeEnvironment, contract: string, owner: string)
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const deploymentData = await deployments.get(contract);
	const contractData = await ethers.getContractAt(artifactName, deploymentData.address);
	const currentOwner = await contractData.owner();
	if (currentOwner !== owner)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.transferOwnership(${owner})\x1B[0m ...`);
		await (await contractData.connect(depSign).transferOwnership(owner)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.transferOwnership(${owner})\x1B[0m ...`);
	}
}

export async function CreatePair(hre: HardhatRuntimeEnvironment, contract: string, token0Address: string, token0Name: string, token1Address: string, token1Name: string)
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const deploymentData = await deployments.get(contract);
	const contractData = await ethers.getContractAt(artifactName, deploymentData.address);

	let pair = await contractData.connect(depSign).getPair(token0Address, token1Address);
	if (pair === "0x0000000000000000000000000000000000000000")
	{
		console.log("ExofiswapFactory - " + token0Name + "/" + token1Name + " Pair not found, start creating...");
		await (await contractData.connect(depSign).createPair(token0Address, token1Address)).wait();
		console.log("ExofiswapFactory - " + token0Name + "/" + token1Name + " Pair created, validate...");
		pair = await contractData.connect(depSign).getPair(token0Address, token1Address);
		if (pair === "0x0000000000000000000000000000000000000000")
		{
			console.log("ExofiswapFactory - " + token0Name + "/" + token1Name + " Pair still not found, cancel deployment");
			throw new Error("Unable to create Pair " + token0Name + "/" + token1Name);
		}
	}
	else
	{
		console.log("ExofiswapFactory - " + token0Name + "/" + token1Name + " Pair found...");
	}
	return pair;
}
