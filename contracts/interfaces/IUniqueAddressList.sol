// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IUniqueAddressList
{
	function add(address newEntry) external;
	function remove(address entry) external;
	function indexOf(address entry) external view returns (uint256);
	function peek(uint256 index) external view returns (address);
}