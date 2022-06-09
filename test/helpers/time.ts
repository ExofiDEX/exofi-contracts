/* eslint-disable node/no-unpublished-import */
import { ethers, network } from "hardhat";

export async function AdvanceBlock()
{
	await network.provider.send("evm_mine");
}

export async function AdvanceBlockTo(blockNumber: number)
{
	const blocks: number = blockNumber - await GetBlockNumber();
	if (blocks > 0)
	{
		await network.provider.send("hardhat_mine", ["0x" + blocks.toString(16)]);
	}
}

export async function GetBlockNumber() : Promise<number>
{
	return await ethers.provider.getBlockNumber();
}
