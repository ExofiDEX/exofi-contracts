// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@exoda/contracts/interfaces/access/IOwnable.sol";
import "@exoda/contracts/interfaces/token/ERC20/IERC20.sol";
import "@exoda/contracts/interfaces/token/ERC20/extensions/IERC20AltApprove.sol";
import "@exoda/contracts/interfaces/token/ERC20/extensions/IERC20Burnable.sol";
import "@exoda/contracts/interfaces/token/ERC20/extensions/IERC20Metadata.sol";

/**
 * @dev Interface of the Fermion token.
 */
interface IFermion is IERC20Burnable, IERC20, IERC20AltApprove, IERC20Metadata, IOwnable
{
	/**
	* @dev Mints `amount` tokens to `account`.
	*
	* Emits a {Transfer} event with `from` set to the zero address.
	*/
	function mint(address to, uint256 amount) external;
}