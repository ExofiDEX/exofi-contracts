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

	/// @inheritdoc ERC20
	function approve(address spender, uint256 amount) override (IFermion, ERC20) public returns (bool)
	{
		return ERC20.approve(spender, amount);
	}

	/// @inheritdoc ERC20Burnable
	function burn(uint256 amount) override (IFermion, ERC20Burnable) public
	{
		ERC20Burnable.burn(amount);
	}

	/// @inheritdoc ERC20Burnable
	function burnFrom(address account, uint256 amount) override (IFermion, ERC20Burnable) public
	{
		ERC20Burnable.burnFrom(account, amount);
	}

	/// @inheritdoc ERC20
	function decreaseAllowance(address spender, uint256 subtractedValue) override (IFermion, ERC20) public returns (bool)
	{
		return ERC20.decreaseAllowance(spender, subtractedValue);
	}

	/// @inheritdoc ERC20
	function increaseAllowance(address spender, uint256 addedValue) override (IFermion, ERC20) public returns (bool)
	{
		return ERC20.increaseAllowance(spender, addedValue);
	}

	/// @notice Creates `amount` token to `to`. Must only be called by the owner (MagneticFieldGenerator).
	function mint(address to, uint256 amount) override public onlyOwner
	{
		_mint(to, amount);
	}

	/// @inheritdoc Ownable
	function renounceOwnership() override(IFermion, Ownable) public
	{
		Ownable.renounceOwnership();
	}

	/// @inheritdoc ERC20
	function transfer(address to, uint256 amount) override (IFermion, ERC20) public returns (bool)
	{
		return ERC20.transfer(to, amount);
	}

	/// @inheritdoc ERC20
	function transferFrom(address from, address to, uint256 amount) override (IFermion, ERC20) public returns (bool)
	{
		return ERC20.transferFrom(from, to, amount);
	}

	/// @inheritdoc Ownable
	function transferOwnership(address newOwner) override(IFermion, Ownable) public
	{
		Ownable.transferOwnership(newOwner);
	}

	/// @inheritdoc ERC20
	function allowance(address ownerAddress, address spenderAddress) override (IFermion, ERC20) public view returns (uint256)
	{
		return ERC20.allowance(ownerAddress, spenderAddress);
	}

	/// @inheritdoc ERC20
	function balanceOf(address account) override (IFermion, ERC20) public view returns (uint256)
	{
		return ERC20.balanceOf(account);
	}

	/// @inheritdoc ERC20
	function name() override (IFermion, ERC20) public view returns (string memory)
	{
		return ERC20.name();
	}

	/// @inheritdoc Ownable
	function owner() override(IFermion, Ownable) public view returns (address)
	{
		return Ownable.owner();
	}

	/// @inheritdoc ERC20
	function symbol() override (IFermion, ERC20) public view returns (string memory)
	{
		return ERC20.symbol();
	}

	/// @inheritdoc ERC20
	function totalSupply() override (IFermion, ERC20) public view returns (uint256)
	{
		return ERC20.totalSupply();
	}

	/// @inheritdoc ERC20
	function decimals() override (IFermion, ERC20) public pure returns (uint8)
	{
		return ERC20.decimals();
	}
}
