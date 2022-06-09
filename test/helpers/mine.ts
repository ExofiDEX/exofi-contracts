/* eslint-disable node/no-unpublished-import */
import { network } from "hardhat";

export async function StopAutomine()
{
	await network.provider.send("evm_setAutomine", [false]);
}

export async function StartAutomine()
{
	await network.provider.send("evm_setAutomine", [true]);
}
