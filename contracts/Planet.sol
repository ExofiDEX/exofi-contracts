// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@exoda/contracts/token/ERC20/ERC20.sol";
import "@exoda/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IPlanet.sol";

contract Planet is IPlanet, ERC20
{
	IERC20Metadata private _token;
	address private immutable _factory;
	constructor() ERC20("Planet", "GRAVITY")
	{
		_factory = _msgSender();
	}

	// called once by the factory at time of deployment
	function initialize(IERC20Metadata tokenInit) override external
	{
		require(_msgSender() == _factory, "Planet: FORBIDDEN");
		require(address(_token) == address(0), "Planet: Already Initalized");
		_token = tokenInit;
	}

	// Locks Tokens and mints PlanetTokens.
	function enter(uint256 amount, address to) override external
	{
		// Mint PlanetToken at 1:1 ratio
		_mint(to, amount);
		// Lock Token in the contract
		SafeERC20.safeTransferFrom(_token, _msgSender(), address(this), amount);
		emit Enter(_msgSender(), amount, to);
	}

	// this low-level function should be called from a contract which performs important safety checks
	function leave(uint256 amount, address to) override external
	{
		// Burn PlanetToken at 1:1 ratio
		_burn(_msgSender(), amount);
		// Transfer Token
		SafeERC20.safeTransfer(_token, to, amount);
		emit Leave(_msgSender(), amount, to);
	}

	function token() override view external returns (IERC20Metadata)
	{
		return _token;
	}

	function name() override(ERC20, IERC20Metadata) public view virtual returns (string memory)
	{
		return string(abi.encodePacked(super.name(), " ", _token.symbol()));
	}
}
