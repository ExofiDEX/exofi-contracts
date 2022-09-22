// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@exoda/contracts/interfaces/token/ERC20/extensions/IERC20Metadata.sol";
import "@exoda/contracts/interfaces/token/ERC20/extensions/IERC20AltApprove.sol";

interface IPlanet is IERC20AltApprove, IERC20Metadata
{
	event Enter(address indexed sender, uint256 amount, address indexed to);
	event Leave(address indexed sender, uint256 amount, address indexed to);

	function enter(uint256 amount, address to) external;
	function leave(uint256 amount, address to) external;
	function initialize(IERC20Metadata tokenInit) external;
	function token() view external returns (IERC20Metadata);
}