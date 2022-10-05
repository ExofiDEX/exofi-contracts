// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IFakeERC20.sol";

contract FakeERC20 is IFakeERC20
{
	uint256 public amount;

	constructor(uint256 initialAmount)
	{
		amount = initialAmount;
	}

	function balanceOf(address) override public view returns (uint256)
	{
		return amount;
	}
}