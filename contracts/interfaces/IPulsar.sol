// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@exoda/contracts/interfaces/access/IOwnable.sol";
import "@exoda/contracts/interfaces/token/ERC20/extensions/IERC20Burnable.sol";

interface IPulsar is IOwnable
{
	function loadToken(uint256 amount) external;
	function die() external;
	function addBenefitary(address benefitary) external;
	function claim() external;
	function getClaimableAmount() external view returns(uint256);
}