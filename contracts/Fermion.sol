// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@exoda/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@exoda/contracts/access/Ownable.sol";
import "./interfaces/IFermion.sol";

/**
* @dev Implementation of the {IFermion} interface.
* The IFermion interface extends the IERC20, IERC20Metadata, IERC20Burnable, IOwnable interfaces.
*
*/
contract Fermion is IFermion, ERC20Burnable, Ownable
{
	// solhint-disable-next-line no-empty-blocks
	constructor() ERC20Burnable("Fermion", "EXOFI") {}

	/// @notice Creates `amount` token to `to`. Must only be called by the owner (MagneticFieldGenerator).
	function mint(address to, uint256 amount) public override onlyOwner
	{
		_mint(to, amount);
	}
}
