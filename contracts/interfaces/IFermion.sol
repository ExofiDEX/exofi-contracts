// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@exoda/exoda-contracts/contracts/interfaces/token/ERC20/extensions/IERC20AltApprove.sol";
import "@exoda/exoda-contracts/contracts/interfaces/token/ERC20/extensions/IERC20Burnable.sol";
import "@exoda/exoda-contracts/contracts/interfaces/token/ERC20/extensions/IERC20Metadata.sol";
import "@exoda/exoda-contracts/contracts/interfaces/access/IOwnable.sol";

/**
 * @dev Interface of the Fermion token.
 */
interface IFermion is IERC20, IERC20Metadata, IOwnable, IERC20AltApprove
{
	/**
	* @dev Destroys `amount` tokens from the caller.
	*
	* Emits a {Transfer} event with `to` set to the zero address.
	*
	* Requirements:
	* - caller must have at least `amount` tokens.
	*/
	function burn(uint256 amount) external;
	
	/**
	* @dev Destroys `amount` tokens from `account`, deducting from the caller's allowance.
	*
	* Emits a {Transfer} event with `to` set to the zero address.
	*
	* Requirements:
	* - caller must have allowance for `account` and `amount` or greater.
	* - `account` must have at least `amount` tokens.
	*/
	function burnFrom(address account, uint256 amount) external;

	function mint(address to, uint256 amount) external;
}
