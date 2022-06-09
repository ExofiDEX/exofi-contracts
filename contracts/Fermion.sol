// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@exoda/exoda-contracts/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@exoda/exoda-contracts/contracts/access/Ownable.sol";
import "./interfaces/IFermion.sol";

/**
* @dev Implementation of the {IFermion} interface.
* The IFermion interface extends the IERC20, IERC20Metadata, IERC20Burnable, IOwnable interfaces.
*
*/
contract Fermion is ERC20Burnable, Ownable, IFermion
{
	// solhint-disable-next-line no-empty-blocks
	constructor() ERC20("Fermion", "EXOFI") {}

	/// @notice Destroys `amount` tokens from the caller.
	function burn(uint256 amount) public override (ERC20Burnable, IFermion)
	{
		ERC20Burnable.burn(amount);
	}

	/// @notice Destroys `amount` tokens from `account`, deducting from the caller's allowance.
	function burnFrom(address account, uint256 amount) public override(ERC20Burnable, IFermion)
	{
		ERC20Burnable.burnFrom(account, amount);
	}

	/// @notice Creates `amount` token to `to`. Must only be called by the owner (MagneticFieldGenerator).
	function mint(address to, uint256 amount) public override onlyOwner
	{
		_mint(to, amount);
	}
}
