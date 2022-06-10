// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev Interface of the Fermion token.
 */
interface IFermion
{
	/**
	* @dev Mints `amount` tokens to `account`.
	*
	* Emits a {Transfer} event with `from` set to the zero address.
	*/
	function mint(address to, uint256 amount) external;
}
