/* eslint-disable node/no-unpublished-import */
import { BigNumber, Contract } from "ethers";
import { defaultAbiCoder, getAddress, keccak256, solidityPack, toUtf8Bytes } from "ethers/lib/utils";
import { getChainId } from "hardhat";

export const MINIMUM_LIQUIDITY = BigNumber.from(10).pow(3);

export const PERMIT_TYPEHASH = keccak256(toUtf8Bytes("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"));

export function ExpandTo18Decimals(n: number): BigNumber
{
	return BigNumber.from(n).mul(BigNumber.from(10).pow(18));
}

export function EncodePrice(reserve0: BigNumber, reserve1: BigNumber)
{
	return [reserve1.mul(BigNumber.from(2).pow(112)).div(reserve0), reserve0.mul(BigNumber.from(2).pow(112)).div(reserve1)];
}

export function GetCreate2Address(factoryAddress: string, [tokenA, tokenB]: [string, string], bytecode: string): string
{
	const [token0, token1] = tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA];
	const create2Inputs = [
		"0xff",
		factoryAddress,
		keccak256(solidityPack(["address", "address"], [token0, token1])),
		keccak256(bytecode)
	];
	const sanitizedInputs = `0x${create2Inputs.map(i => i.slice(2)).join("")}`;
	return getAddress(`0x${keccak256(sanitizedInputs).slice(-40)}`);
}

export async function GetDomainSeparator(name: string, tokenAddress: string): Promise<string>
{
	return keccak256(
		defaultAbiCoder.encode(
			["bytes32", "bytes32", "bytes32", "uint256", "address"],
			[
				keccak256(toUtf8Bytes("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")),
				keccak256(toUtf8Bytes(name)),
				keccak256(toUtf8Bytes("1")),
				await getChainId(),
				tokenAddress
			]
		)
	);
}

export async function GetApprovalDigest(
	token: Contract,
	approve: { owner: string, spender: string, value: BigNumber },
	nonce: BigNumber,
	deadline: BigNumber
): Promise<string>
{
	const name = await token.name();
	const DOMAIN_SEPARATOR = await GetDomainSeparator(name, token.address);
	const dac = defaultAbiCoder.encode(
		["bytes32", "address", "address", "uint256", "uint256", "uint256"],
		[PERMIT_TYPEHASH, approve.owner, approve.spender, approve.value, nonce, deadline]
	);
	const pack = solidityPack(
		["bytes1", "bytes1", "bytes32", "bytes32"],
		[
			"0x19",
			"0x01",
			DOMAIN_SEPARATOR,
			keccak256(dac)
		]
	);
	return keccak256(pack);
}
