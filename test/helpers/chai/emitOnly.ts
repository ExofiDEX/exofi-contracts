/* eslint-disable node/no-unpublished-import */
import { expect } from "chai";
import { Contract, ContractTransaction } from "ethers";

export async function EmitOnlyThis(val: ContractTransaction, contract: Contract, ...eventNames: string[])
{
	for (const event in contract.interface.events)
	{
		const eventFragment = contract.interface.getEvent(event);
		if (!eventNames.includes(event) && !eventNames.includes(eventFragment.name))
		{
			await expect(val).to.not.emit(contract, event);
		}
	}
	for (const eventName of eventNames)
	{
		await expect(val).to.emit(contract, eventName);
	}
}
