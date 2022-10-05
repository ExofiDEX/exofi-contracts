// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@exoda/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract ERC20BurnableMock is ERC20Burnable
{
	constructor(string memory name, string memory symbol, uint256 supply) ERC20Burnable(name, symbol)
	{
		_mint(msg.sender, supply);
	}
}