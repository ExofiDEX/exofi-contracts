// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IMigratorDevice.sol";
import "./Planet.sol";

contract FerMigrator is IMigratorDevice
{
	address private immutable _beneficiary;
	address private immutable _planet;
	constructor(address beneficiaryAddress, address planet)
	{
		_beneficiary = beneficiaryAddress;
		_planet = planet;
	}

	function migrate(IERC20 src) override public returns (address)
	{
		require(address(src) == address(0x7d5e85d281CE6E93C6D17b4887e58242A23703c3), "FerMigrator: Not Fermion token");
		uint256 bal = src.balanceOf(msg.sender);
		src.transferFrom(msg.sender, address(this), bal);
		src.approve(address(_planet), bal);
		Planet(_planet).enter(bal, _beneficiary);
		return _planet;
	}

	function beneficiary() override public view returns(address)
	{
		return _beneficiary;
	}
}