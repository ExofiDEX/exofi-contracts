// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@exoda/contracts/interfaces/token/ERC20/extensions/IERC20Burnable.sol";
import "./interfaces/IPulsar.sol";

contract Pulsar is IPulsar
{
	uint256 private immutable _startBlockPhase1;
	uint256 private immutable _startBlockPhase2;
	uint256 private immutable _startBlockPhase3;
	uint256 private immutable _startBlockPhase4;
	uint256 private immutable _endBlock;
	uint256 private immutable _finalBlock;
	IERC20Burnable private immutable _token;

	constructor(uint256 startBlock, uint256 endBlock, uint256 finalizingBlock, IERC20Burnable token)
	{
		uint256 part = (endBlock - startBlock) / 4;
		_startBlockPhase1 = startBlock;
		_startBlockPhase2 = startBlock + part;
		_startBlockPhase3 = startBlock + (part * 2);
		_startBlockPhase4 = startBlock + (part * 3);
		_endBlock = endBlock;
		_finalBlock = finalizingBlock;
		_token = token;
	}
}