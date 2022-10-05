// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../Exofiswap/ExofiswapERC20.sol";

contract ExofiswapERC20Mock is ExofiswapERC20
{
	constructor(string memory name, uint256 supply) ExofiswapERC20(name)
	{
		_mint(msg.sender, supply);
	}
}