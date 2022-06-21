// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IFakeERC20
{
	function balanceOf(address) external view returns (uint256);
}