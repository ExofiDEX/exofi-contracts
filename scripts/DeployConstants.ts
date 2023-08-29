import { tokens } from "./Constants";

// const AddressZero = "0x0000000000000000000000000000000000000000";

/* eslint-disable indent */
export function LoadNetworkSpecificValues(): { accounts: string[] | { mnemonic: string }, deployer: string | undefined, dev: string | undefined }
{
	switch (process.env.NETWORK)
	{
		case undefined:
		{
			return {
				accounts: { mnemonic: "test test test test test test test test test test test junk" },
				deployer: undefined,
				dev: undefined
			};
		}
		case "goerli":
		{
			if (process.env.GOERLI_MNEMONIC === undefined) throw Error("Missing environment variable GOERLI_MNEMONIC");
			if (process.env.GOERLI_OWNER === undefined) throw Error("Missing environment variable GOERLI_OWNER");
			if (process.env.GOERLI_DEVELOPER === undefined) throw Error("Missing environment variable GOERLI_DEVELOPER");
			return {
				accounts: {
					mnemonic: process.env.GOERLI_MNEMONIC
					// accountsBalance: ethers.utils.parseEther("1");
				}, deployer: process.env.GOERLI_OWNER, dev: process.env.GOERLI_DEVELOPER
			};
		}
		case "main":
		{
			if (process.env.MAIN_MNEMONIC === undefined) throw Error("Missing environment variable MAIN_MNEMONIC");
			if (process.env.MAIN_OWNER === undefined) throw Error("Missing environment variable MAIN_OWNER");
			if (process.env.MAIN_DEVELOPER === undefined) throw Error("Missing environment variable MAIN_DEVELOPER");
			return {
				accounts: {
					mnemonic: process.env.MAIN_MNEMONIC
					// accountsBalance: ethers.utils.parseEther("1");
				}, deployer: process.env.MAIN_OWNER, dev: process.env.MAIN_DEVELOPER
			};
		}
		case "base_goerli":
		{
			if (process.env.BASEGOERLI_MNEMONIC === undefined) throw Error("Missing environment variable BASEGOERLI_MNEMONIC");
			if (process.env.BASEGOERLI_OWNER === undefined) throw Error("Missing environment variable BASEGOERLI_OWNER");
			if (process.env.BASEGOERLI_DEVELOPER === undefined) throw Error("Missing environment variable BASEGOERLI_DEVELOPER");
			return {
				accounts: {
					mnemonic: process.env.BASEGOERLI_MNEMONIC
					// accountsBalance: ethers.utils.parseEther("1");
				}, deployer: process.env.BASEGOERLI_OWNER, dev: process.env.BASEGOERLI_DEVELOPER
			};
		}
		case "base_main":
		{
			if (process.env.BASEMAIN_MNEMONIC === undefined) throw Error("Missing environment variable BASEMAIN_MNEMONIC");
			if (process.env.BASEMAIN_OWNER === undefined) throw Error("Missing environment variable BASEMAIN_OWNER");
			if (process.env.BASEMAIN_DEVELOPER === undefined) throw Error("Missing environment variable BASEMAIN_DEVELOPER");
			return {
				accounts: {
					mnemonic: process.env.BASEMAIN_MNEMONIC
					// accountsBalance: ethers.utils.parseEther("1");
				}, deployer: process.env.BASEMAIN_OWNER, dev: process.env.BASEMAIN_DEVELOPER
			};
		}
		default:
			throw Error(`Unknown network ${process.env.NETWORK}`);
	}
}

export async function GetTokenAddress(): Promise<{ nativeToken: string, usdc: string, usdt: string, dai: string }>
{
	switch (process.env.NETWORK)
	{
		case "goerli":
		case "main":
		case "base_goerli":
		case "base_main":
			break;
		default:
			throw Error(`Unknown network ${process.env.NETWORK}`);
	}
	return {
		nativeToken: tokens[process.env.NETWORK].NATIVE.address, // WETH
		usdc: tokens[process.env.NETWORK].USDC.address,
		usdt: tokens[process.env.NETWORK].USDT.address,
		dai: tokens[process.env.NETWORK].DAI.address
	};
}