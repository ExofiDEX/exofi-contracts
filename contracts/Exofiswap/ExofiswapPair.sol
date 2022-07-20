// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@exoda/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IExofiswapCallee.sol";
import "./interfaces/IExofiswapFactory.sol";
import "./interfaces/IExofiswapPair.sol";
import "./interfaces/IMigrator.sol";
import "./ExofiswapERC20.sol";
import "./libraries/Math.sol";
import "./libraries/UQ144x112.sol";

contract ExofiswapPair is IExofiswapPair, ExofiswapERC20
{
	using UQ144x112 for uint256;
	using SafeERC20 for IERC20Metadata;

	uint256 private constant _MINIMUM_LIQUIDITY = 10**3;
	uint256 private _price0CumulativeLast;
	uint256 private _price1CumulativeLast;
	uint256 private _kLast; // reserve0 * reserve1, as of immediately after the most recent liquidity event
	uint256 private _unlocked = 1;
	uint112 private _reserve0;           // uses single storage slot, accessible via getReserves
	uint112 private _reserve1;           // uses single storage slot, accessible via getReserves
	uint32  private _blockTimestampLast; // uses single storage slot, accessible via getReserves
	IExofiswapFactory private _factory;
	IERC20Metadata private immutable _token0;
	IERC20Metadata private immutable _token1;

	modifier lock()
	{
		require(_unlocked == 1, "EP: LOCKED");
		_unlocked = 0;
		_;
		_unlocked = 1;
	}

	constructor(IERC20Metadata token0Init, IERC20Metadata token1Init)
		ExofiswapERC20(string(abi.encodePacked(token0Init.symbol(), "/", token1Init.symbol(), " Plasma")))
	{
		_factory = IExofiswapFactory(_msgSender());
		_token0 = token0Init;
		_token1 = token1Init;
	}

	// this low-level function should be called from a contract which performs important safety checks
	function burn(address to) override public lock returns (uint, uint)
	{
		(uint112 reserve0, uint112 reserve1,) = getReserves(); // gas savings
		IERC20Metadata ltoken0 = _token0;                      // gas savings
		IERC20Metadata ltoken1 = _token1;                      // gas savings
		uint256 balance0 = ltoken0.balanceOf(address(this));
		uint256 balance1 = ltoken1.balanceOf(address(this));
		uint256 liquidity = balanceOf(address(this));

		// Can not overflow
		bool feeOn = _mintFee(_unsafeMul(uint256(reserve0), uint256(reserve1)));
		uint256 totalSupply = totalSupply(); // gas savings, must be defined here since totalSupply can update in _mintFee
		uint256 amount0 = _unsafeDiv(liquidity * balance0, totalSupply); // using balances ensures pro-rata distribution
		uint256 amount1 = _unsafeDiv(liquidity * balance1, totalSupply); // using balances ensures pro-rata distribution
		require(amount0 > 0 && amount1 > 0, "EP: INSUFFICIENT_LIQUIDITY");
		_burn(address(this), liquidity);
		ltoken0.safeTransfer(to, amount0);
		ltoken1.safeTransfer(to, amount1);
		balance0 = ltoken0.balanceOf(address(this));
		balance1 = ltoken1.balanceOf(address(this));

		_update(balance0, balance1, reserve0, reserve1);
		if (feeOn)
		{
			unchecked // Can not overflow
			{
				_kLast = uint256(_reserve0) * uint256(_reserve1); // _reserve0 and _reserve1 are up-to-date
			}
		}
		emit Burn(msg.sender, amount0, amount1, to);
		return (amount0, amount1);
	}

	// this low-level function should be called from a contract which performs important safety checks
	function mint(address to) override public lock returns (uint256)
	{
		(uint112 reserve0, uint112 reserve1,) = getReserves(); // gas savings
		uint balance0 = _token0.balanceOf(address(this));
		uint balance1 = _token1.balanceOf(address(this));
		uint amount0 = balance0 - reserve0;
		uint amount1 = balance1 - reserve1;

		bool feeOn = _mintFee(_unsafeMul(uint256(reserve0), uint256(reserve1)));
		uint256 totalSupply = totalSupply(); // gas savings, must be defined here since totalSupply can update in _mintFee
		uint256 liquidity;

		if (totalSupply == 0)
		{
			address migrator = _factory.migrator();
			if (_msgSender() == migrator)
			{
				liquidity = IMigrator(migrator).desiredLiquidity();
				require(liquidity > 0 && liquidity != type(uint256).max, "EP: Liquidity Error");
			}
			else
			{
				require(migrator == address(0), "EP: Migrator set");
				liquidity = Math.sqrt(amount0 * amount1) - _MINIMUM_LIQUIDITY;
				_mint(address(0), _MINIMUM_LIQUIDITY); // permanently lock the first MINIMUM_LIQUIDITY tokens
			}
		}
		else
		{
			liquidity = Math.min((amount0 * totalSupply) / reserve0, (amount1 * totalSupply) / reserve1);
		}
		require(liquidity > 0, "EP: INSUFFICIENT_LIQUIDITY");
		_mint(to, liquidity);

		_update(balance0, balance1, reserve0, reserve1);
		if (feeOn)
		{
			_kLast = uint256(_reserve0) * uint256(_reserve1); // reserve0 and reserve1 are up-to-date
		}
		emit Mint(_msgSender(), amount0, amount1);
		return liquidity;
	}

	// force balances to match reserves
	function skim(address to) override public lock
	{
		IERC20Metadata ltoken0 = _token0; // gas savings
		IERC20Metadata ltoken1 = _token1; // gas savings
		
		ltoken0.safeTransfer(to, ltoken0.balanceOf(address(this)) - _reserve0);
		ltoken1.safeTransfer(to, ltoken1.balanceOf(address(this)) - _reserve1);
	}

	// this low-level function should be called from a contract which performs important safety checks
	function swap(uint256 amount0Out, uint256 amount1Out, IExofiswapCallee to, bytes calldata data) override public lock
	{
		require(amount0Out > 0 || amount1Out > 0, "EP: INSUFFICIENT_OUTPUT_AMOUNT");
		(uint112 reserve0, uint112 reserve1,) = getReserves(); // gas savings
		require(amount0Out < reserve0 && amount1Out < reserve1, "EP: INSUFFICIENT_LIQUIDITY");

		uint256 balance0;
		uint256 balance1;
		{
			// scope for _token{0,1}, avoids stack too deep errors
			IERC20Metadata ltoken0 = _token0;
			IERC20Metadata ltoken1 = _token1;
			require(address(to) != address(ltoken0) && address(to) != address(ltoken1), "EP: INVALID_TO");
			if (amount0Out > 0) ltoken0.safeTransfer(address(to), amount0Out); // optimistically transfer tokens
			if (amount1Out > 0) ltoken1.safeTransfer(address(to), amount1Out); // optimistically transfer tokens
			if (data.length > 0) to.exofiswapCall(_msgSender(), amount0Out, amount1Out, data);
			balance0 = ltoken0.balanceOf(address(this));
			balance1 = ltoken1.balanceOf(address(this));
		}

		uint256 div0 = _unsafeSub(reserve0, amount0Out);
		uint256 div1 = _unsafeSub(reserve1, amount1Out);
		uint amount0In = balance0 > div0 ? _unsafeSub(balance0, div0) : 0;
		uint amount1In = balance1 > div1 ? _unsafeSub(balance1, div1) : 0;
		require(amount0In > 0 || amount1In > 0, "EP: INSUFFICIENT_INPUT_AMOUNT");
		{ // scope for reserve{0,1} Adjusted, avoids stack too deep errors
			uint256 balance0Adjusted = (balance0 * 1000) - (amount0In * 3);
			uint256 balance1Adjusted = (balance1 * 1000) - (amount1In * 3);
			require(balance0Adjusted * balance1Adjusted >= uint256(reserve0) * uint256(reserve1) * (1000**2), "EP: K");
		}

		_update(balance0, balance1, reserve0, reserve1);
		emit Swap(_msgSender(), amount0In, amount1In, amount0Out, amount1Out, address(to));
	}

	
	// force reserves to match balances
	function sync() override public lock
	{
		_update(_token0.balanceOf(address(this)), _token1.balanceOf(address(this)), _reserve0, _reserve1);
	}
	
	function factory() override public view returns (IExofiswapFactory)
	{
		return _factory;
	}

	function getReserves() override public view returns (uint112, uint112, uint32)
	{
		return (_reserve0, _reserve1, _blockTimestampLast);
	}

	function kLast() override public view returns (uint256)
	{
		return _kLast;
	}

	function price0CumulativeLast() override public view returns (uint256)
	{
		return _price0CumulativeLast;
	}

	function price1CumulativeLast() override public view returns (uint256)
	{
		return _price1CumulativeLast;
	}

	function token0() override public view returns (IERC20Metadata)
	{
		return _token0;
	}
	
	function token1() override public view returns (IERC20Metadata)
	{
		return _token1;
	}

	function MINIMUM_LIQUIDITY() override public pure returns (uint256) //solhint-disable-line func-name-mixedcase
	{
		return _MINIMUM_LIQUIDITY;
	}

	// if fee is on, mint liquidity equivalent to 1/6th of the growth in sqrt(k)
	function _mintFee(uint256 k) private returns (bool)
	{
		address feeTo = _factory.feeTo();
		uint256 kLastHelp = _kLast; // gas savings
		if (feeTo != address(0))
		{
			if (kLastHelp != 0)
			{
				uint256 rootK = Math.sqrt(k);
				uint256 rootKLast = Math.sqrt(kLastHelp);
				if (rootK > rootKLast)
				{
					uint256 numerator = totalSupply() * _unsafeSub(rootK, rootKLast);
					uint256 denominator = (rootK * 5) + rootKLast;
					uint256 liquidity = _unsafeDiv(numerator, denominator);
					if (liquidity > 0)
					{
						_mint(feeTo, liquidity);
					}
				}
			}
			return true;
		}
		if(kLastHelp != 0)
		{
			_kLast = 0;
		}
		return false;
	}

	// update reserves and, on the first call per block, price accumulators
	function _update(uint256 balance0, uint256 balance1, uint112 reserve0, uint112 reserve1) private
	{
		require(balance0 <= type(uint112).max && balance1 <= type(uint112).max, "EP: OVERFLOW");
		// solhint-disable-next-line not-rely-on-time
		uint32 blockTimestamp = uint32(block.timestamp % 2**32);
		uint32 timeElapsed = _unsafeSub32(blockTimestamp, _blockTimestampLast); // overflow is desired
		if (timeElapsed > 0 && reserve0 != 0 && reserve1 != 0)
		{
			// * never overflows, and + overflow is desired
			unchecked
			{
				_price0CumulativeLast += (UQ144x112.encode(reserve1).uqdiv(reserve0) * timeElapsed);
				_price1CumulativeLast += (UQ144x112.encode(reserve0).uqdiv(reserve1) * timeElapsed);
			}
		}
		_reserve0 = uint112(balance0);
		_reserve1 = uint112(balance1);
		_blockTimestampLast = blockTimestamp;
		emit Sync(_reserve0, _reserve1);
	}

	function _unsafeDiv(uint256 a, uint256 b) private pure returns (uint256)
	{
		unchecked
		{
			return a / b;
		}
	}

	function _unsafeMul(uint256 a, uint256 b) private pure returns (uint256)
	{
		unchecked
		{
			return a * b;
		}
	}

	function _unsafeSub(uint256 a, uint256 b) private pure returns (uint256)
	{
		unchecked
		{
			return a - b;
		}
	}

	function _unsafeSub32(uint32 a, uint32 b) private pure returns (uint32)
	{
		unchecked
		{
			return a - b;
		}
	}
}
