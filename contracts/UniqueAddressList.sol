// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IUniqueAddressList.sol";

contract UniqueAddressList is IUniqueAddressList
{
	mapping (address => uint256) private _index;
	address[] private _store;

	constructor()
	{
		_store.push(address(0));
	}

	function add(address entry) override public
	{
		if(entry == address(0))
		{
			return;
		}
		if(indexOf(entry) == 0)
		{
			_index[entry] = _store.length;
			_store.push(entry);
		}
	}

	function remove(address entry) override public
	{
		if(entry == address(0))
		{
			return;
		}
		uint256 index = indexOf(entry);
		if(index == 0)
		{
			return;
		}
		uint256 lastIndex = _store.length - 1;
		if(lastIndex > index)
		{
			address copy = _store[lastIndex];
			_store[index] = copy;
			_index[copy] = index;
		}
		delete _index[entry];
		_store.pop();
	}

	function indexOf(address entry) override public view returns (uint256)
	{
		return _index[entry];
	}

	function peek(uint256 index) override public view returns (address)
	{
		return _store[index];
	}
}