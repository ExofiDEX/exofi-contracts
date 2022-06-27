// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@exoda/contracts/interfaces/token/ERC20/extensions/IERC20Burnable.sol";
import "./interfaces/IPulsar.sol";
import "@exoda/contracts/access/Ownable.sol";

contract Pulsar is IPulsar, Ownable
{
	uint256 private immutable _startBlockPhase1;
	uint256 private immutable _startBlockPhase2;
	uint256 private immutable _startBlockPhase3;
	uint256 private immutable _startBlockPhase4;
	uint256 private immutable _endBlock;
	uint256 private immutable _finalBlock;
	uint256 private _benefitaryCount;
	uint256 private _amountPerBlockPhase1;
	uint256 private _amountPerBlockPhase2;
	uint256 private _amountPerBlockPhase3;
	uint256 private _amountPerBlockPhase4;
	mapping(address => uint256) private _lastWithdraw;
	IERC20Burnable private immutable _token;

	constructor(uint256 startBlock, uint256 endBlock, uint256 finalizingBlock, IERC20Burnable token) Ownable()
	{
		// Split the start and end intervall into 4 parts.
		unchecked
		{
			uint256 part = (endBlock - startBlock) / 4;
			_startBlockPhase1 = startBlock;
			_startBlockPhase2 = startBlock + part;
			_startBlockPhase3 = startBlock + (part * 2);
			_startBlockPhase4 = startBlock + (part * 3);
		}
		_endBlock = endBlock;
		_finalBlock = finalizingBlock;
		_token = token;
	}

	function loadToken(uint256 amount) override public onlyOwner
	{
		require(block.number < _startBlockPhase1, "Pulsar: Can only set before start block"); // solhint-disable-line reason-string
		uint256 fraction = (amount * 16) / 15;
		unchecked
		{
			uint256 ph1Blocks = _startBlockPhase2 - _startBlockPhase1;
			uint256 ph2Blocks = _startBlockPhase3 - _startBlockPhase2;
			uint256 ph3Blocks = _startBlockPhase4 - _startBlockPhase3;
			uint256 amountPhase1 = fraction / 2;
			uint256 amountPhase2 = fraction / 4;
			uint256 amountPhase3 = fraction / 8;
			_amountPerBlockPhase1 = amountPhase1 / ph1Blocks;
			_amountPerBlockPhase2 = amountPhase2 / ph2Blocks;
			_amountPerBlockPhase3 = amountPhase3 / ph3Blocks;
			// Minimize cut of decimal errors.
			uint256 amountPhase4 = amount - ((_amountPerBlockPhase1 * ph1Blocks) +
				(_amountPerBlockPhase2 * ph2Blocks) +
				(_amountPerBlockPhase3 * ph3Blocks));
			_amountPerBlockPhase4 = amountPhase4 / (_endBlock - _startBlockPhase4);
		}
		uint256 allowance = _token.allowance(owner(), address(this));
		require(allowance == amount, "Pulsar: Allowance must be equal to amount");  // solhint-disable-line reason-string
		_token.transferFrom(owner(), address(this), amount);
	}

	/// @notice Runs the last task after reaching the final block.
	function die() override public
	{
		require(block.number > _finalBlock, "Pulsar: Can only be killed after final block"); // solhint-disable-line reason-string
		uint256 remainingAmount = _token.balanceOf(address(this));
		_token.burn(remainingAmount);
	}

	/// @notice Adds a benefitary as long as the startBlock is not reached.
	function addBenefitary(address benefitary) override public onlyOwner
	{
		require(block.number < _startBlockPhase1, "Pulsar: Can only added before start block"); // solhint-disable-line reason-string
		_lastWithdraw[benefitary] = _startBlockPhase1;
		++_benefitaryCount;
	}

	function claim() override public
	{
		address sender = msg.sender;
		require(_lastWithdraw[sender] > 0, "Pulsar: Only benefitaries can claim"); // solhint-disable-line reason-string
		uint256 amount = getClaimableAmount();
		_lastWithdraw[sender] = block.number;
		_token.transfer(sender, amount);
	}

	function getClaimableAmount() override public view returns(uint256)
	{
		uint256 lw = _lastWithdraw[msg.sender];
		uint256 currentBlock = block.number;

		if ((currentBlock < _startBlockPhase1) || (currentBlock > _finalBlock))
		{
			return 0; // Not started yet or final Block reached.
		}
		if (lw < _startBlockPhase1)
		{
			return 0; // Not in list
		}

		unchecked
		{
			uint256 ph1Blocks =_max(_min(_startBlockPhase2, currentBlock), _startBlockPhase1) - _min(_max(lw, _startBlockPhase1), _startBlockPhase2);
			uint256 ph2Blocks = _max(_min(_startBlockPhase3, currentBlock), _startBlockPhase2) - _min(_max(lw, _startBlockPhase2), _startBlockPhase3);
			uint256 ph3Blocks = _max(_min(_startBlockPhase4, currentBlock), _startBlockPhase3) - _min(_max(lw, _startBlockPhase3), _startBlockPhase4);
			uint256 ph4Blocks = _max(_min(_endBlock, currentBlock), _startBlockPhase4) -_min(_max(lw, _startBlockPhase4), _endBlock);

			return ((ph1Blocks * _amountPerBlockPhase1) +
				(ph2Blocks * _amountPerBlockPhase2) +
				(ph3Blocks * _amountPerBlockPhase3) +
				(ph4Blocks * _amountPerBlockPhase4)) / _benefitaryCount;
		}
	}

	function _min(uint256 a, uint256 b) private pure returns(uint256)
	{
		return a <= b ? a : b;
	}

	function _max(uint256 a, uint256 b) private pure returns(uint256)
	{
		return a >= b ? a : b;
	}
}
