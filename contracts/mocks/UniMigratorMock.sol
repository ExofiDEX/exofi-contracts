// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IMigratorDevice.sol";
import "../FakeERC20.sol";

contract UniMigratorMock is IMigratorDevice
{
	address private _beneficiary;
	address private _testToken;

	constructor(address beneficiaryAddress, address testToken)
	{
		_beneficiary = beneficiaryAddress;
		_testToken = testToken;
	}

	function migrate(IERC20 src) override public returns (address)
	{
		require(address(src) == _testToken, "UniMigratorMock: Not correct token"); //solhint-disable-line reason-string
		uint256 bal = src.balanceOf(msg.sender);
		src.transferFrom(msg.sender, _beneficiary, bal);
		return address(new FakeERC20(bal));
	}

	function beneficiary() override public view returns(address)
	{
		return _beneficiary;
	}
}