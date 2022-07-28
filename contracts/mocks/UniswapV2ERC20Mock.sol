// SPDX-License-Identifier: MIT
pragma solidity =0.6.12;

import "../uniswapv2/UniswapV2ERC20.sol";

contract UniswapV2ERC20Mock is UniswapV2ERC20
{
	constructor(uint256 supply) UniswapV2ERC20() public
	{
		_mint(msg.sender, supply);
	}
}