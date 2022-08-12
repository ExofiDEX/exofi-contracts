// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@exoda/contracts/interfaces/token/ERC20/extensions/IERC20Metadata.sol";
import "@exoda/contracts/token/ERC20/utils/SafeERC20.sol";
import "@exoda/contracts/utils/Context.sol";
import "./libraries/ExofiswapLibrary.sol";
import "./libraries/MathUInt256.sol";
import "./interfaces/IExofiswapFactory.sol";
import "./interfaces/IExofiswapRouter.sol";
import "./interfaces/IWETH9.sol";

contract ExofiswapRouter is IExofiswapRouter, Context
{
	IExofiswapFactory private immutable _swapFactory;
	IWETH9 private immutable _wrappedEth;

	modifier ensure(uint256 deadline) {
		require(deadline >= block.timestamp, "ER: EXPIRED"); // solhint-disable-line not-rely-on-time
		_;
	}

	constructor(IExofiswapFactory swapFactory, IWETH9 wrappedEth)
	{
		_swapFactory = swapFactory;
		_wrappedEth = wrappedEth;
	}

	receive() override external payable
	{
		assert(_msgSender() == address(_wrappedEth)); // only accept ETH via fallback from the WETH contract
	}

	function addLiquidityETH(
		IERC20Metadata token,
		uint256 amountTokenDesired,
		uint256 amountTokenMin,
		uint256 amountETHMin,
		address to,
		uint256 deadline
	) override external virtual payable ensure(deadline) returns (uint256 amountToken, uint256 amountETH, uint256 liquidity)
	{
		IExofiswapPair pair;
		(amountToken, amountETH, pair) = _addLiquidity(
			token,
			_wrappedEth,
			amountTokenDesired,
			msg.value,
			amountTokenMin,
			amountETHMin
		);
		SafeERC20.safeTransferFrom(token, _msgSender(), address(pair), amountToken);
		_wrappedEth.deposit{value: amountETH}();
		assert(_wrappedEth.transfer(address(pair), amountETH));
		liquidity = pair.mint(to);
		// refund dust eth, if any
		if (msg.value > amountETH) ExofiswapLibrary.safeTransferETH(_msgSender(), MathUInt256.unsafeSub(msg.value, amountETH));
	}

	function addLiquidity(
		IERC20Metadata tokenA,
		IERC20Metadata tokenB,
		uint256 amountADesired,
		uint256 amountBDesired,
		uint256 amountAMin,
		uint256 amountBMin,
		address to,
		uint256 deadline
	) override external virtual ensure(deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity)
	{
		IExofiswapPair pair;
		(amountA, amountB, pair) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
		_safeTransferFrom(tokenA, tokenB, address(pair), amountA, amountB);
		liquidity = pair.mint(to);
	}

	function removeLiquidity(
		IERC20Metadata tokenA,
		IERC20Metadata tokenB,
		uint256 liquidity,
		uint256 amountAMin,
		uint256 amountBMin,
		address to,
		uint256 deadline
	) external virtual override ensure(deadline) returns (uint256, uint256)
	{
		// Calling the factory is cheaper than calculating the address, and removeLiquidity can only be done on existing pairs.
		IExofiswapPair pair = _swapFactory.getPair(tokenA, tokenB);
		return _removeLiquidity(pair, tokenB < tokenA, liquidity, amountAMin, amountBMin, to);
	}

	function removeLiquidityETH(
		IERC20Metadata token,
		uint256 liquidity,
		uint256 amountTokenMin,
		uint256 amountETHMin,
		address to,
		uint256 deadline
	) external override virtual ensure(deadline) returns (uint256 amountToken, uint256 amountETH)
	{
		IExofiswapPair pair = _swapFactory.getPair(token, _wrappedEth);
		(amountToken, amountETH) = _removeLiquidity(pair, _wrappedEth < token, liquidity, amountTokenMin, amountETHMin, address(this));
		SafeERC20.safeTransfer(token, to, amountToken);
		_wrappedEth.withdraw(amountETH);
		ExofiswapLibrary.safeTransferETH(to, amountETH);
	}

	function removeLiquidityETHSupportingFeeOnTransferTokens(
		IERC20Metadata token,
		uint256 liquidity,
		uint256 amountTokenMin,
		uint256 amountETHMin,
		address to,
		uint256 deadline
	) override external virtual ensure(deadline) returns (uint256 amountETH)
	{
		// Calling the factory is cheaper than calculating the address, and removeLiquidity can only be done on existing pairs.
		IExofiswapPair pair = _swapFactory.getPair(token, _wrappedEth);
		(, amountETH) = _removeLiquidity(pair, _wrappedEth < token, liquidity, amountTokenMin, amountETHMin, address(this));
		SafeERC20.safeTransfer(token, to, token.balanceOf(address(this)));
		_wrappedEth.withdraw(amountETH);
		ExofiswapLibrary.safeTransferETH(to, amountETH);
	}

	function removeLiquidityETHWithPermit(
		IERC20Metadata token,
		uint256 liquidity,
		uint256 amountTokenMin,
		uint256 amountETHMin,
		address to,
		uint256 deadline,
		bool approveMax, uint8 v, bytes32 r, bytes32 s
	) external override virtual returns (uint amountToken, uint amountETH)
	{
		IExofiswapPair pair = _swapFactory.getPair(token, _wrappedEth);
		{
			uint256 value = approveMax ? type(uint256).max : liquidity;
			pair.permit(_msgSender(), address(this), value, deadline, v, r, s); // ensure(deadline) happens here
		}
		(amountToken, amountETH) = _removeLiquidity(pair, _wrappedEth < token, liquidity, amountTokenMin, amountETHMin, address(this));
		SafeERC20.safeTransfer(token, to, amountToken);
		_wrappedEth.withdraw(amountETH);
		ExofiswapLibrary.safeTransferETH(to, amountETH);
	}

	function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
		IERC20Metadata token,
		uint256 liquidity,
		uint256 amountTokenMin,
		uint256 amountETHMin,
		address to,
		uint256 deadline,
		bool approveMax,
		uint8 v,
		bytes32 r,
		bytes32 s
	) override external virtual returns (uint256 amountETH)
	{
		// Calling the factory is cheaper than calculating the address, and removeLiquidity can only be done on existing pairs.
		// IExofiswapPair pair = ExofiswapLibrary.pairFor(_swapFactory, address(token), address(_wrappedEth));
		{
			IExofiswapPair pair = _swapFactory.getPair(token, _wrappedEth);
			uint256 value = approveMax ? type(uint256).max : liquidity;
			pair.permit(_msgSender(), address(this), value, deadline, v, r, s); // ensure(deadline) happens here
			(, amountETH) = _removeLiquidity(pair, _wrappedEth < token, liquidity, amountTokenMin, amountETHMin, address(this));
		}
		SafeERC20.safeTransfer(token, to, token.balanceOf(address(this)));
		_wrappedEth.withdraw(amountETH);
		ExofiswapLibrary.safeTransferETH(to, amountETH);
	}

	function removeLiquidityWithPermit(
		IERC20Metadata tokenA,
		IERC20Metadata tokenB,
		uint256 liquidity,
		uint256 amountAMin,
		uint256 amountBMin,
		address to,
		uint256 deadline,
		bool approveMax, uint8 v, bytes32 r, bytes32 s
	) external override virtual returns (uint256 amountA, uint256 amountB)
	{
		IExofiswapPair pair = _swapFactory.getPair(tokenA, tokenB);
		{
			uint256 value = approveMax ? type(uint256).max : liquidity;
			pair.permit(_msgSender(), address(this), value, deadline, v, r, s); // ensure(deadline) happens here
		}
		(amountA, amountB) = _removeLiquidity(pair, tokenB < tokenA, liquidity, amountAMin, amountBMin, to);
	}

	function swapExactTokensForETHSupportingFeeOnTransferTokens(
		uint256 amountIn,
		uint256 amountOutMin,
		IERC20Metadata[] calldata path,
		address to,
		uint256 deadline
	) override external virtual ensure(deadline)
	{
		require(path[MathUInt256.unsafeDec(path.length)] == _wrappedEth, "ER: INVALID_PATH");
		SafeERC20.safeTransferFrom(path[0], _msgSender(), address(_swapFactory.getPair(path[0], path[1])), amountIn);
		_swapSupportingFeeOnTransferTokens(path, address(this));
		uint256 amountOut = _wrappedEth.balanceOf(address(this));
		require(amountOut >= amountOutMin, "ER: INSUFFICIENT_OUTPUT_AMOUNT");
		_wrappedEth.withdraw(amountOut);
		ExofiswapLibrary.safeTransferETH(to, amountOut);
	}

	function swapExactTokensForTokens(
		uint256 amountIn,
		uint256 amountOutMin,
		IERC20Metadata[] calldata path,
		address to,
		uint256 deadline
	) external override virtual ensure(deadline) returns (uint256[] memory amounts)
	{
		amounts = ExofiswapLibrary.getAmountsOut(_swapFactory, amountIn, path);
		require(amounts[MathUInt256.unsafeDec(amounts.length)] >= amountOutMin, "ER: INSUFFICIENT_OUTPUT_AMOUNT");
		SafeERC20.safeTransferFrom(path[0], _msgSender(), address(_swapFactory.getPair(path[0], path[1])), amounts[0]);
		_swap(amounts, path, to);
	}

	function swapExactTokensForTokensSupportingFeeOnTransferTokens(
		uint256 amountIn,
		uint256 amountOutMin,
		IERC20Metadata[] calldata path,
		address to,
		uint256 deadline
	) override external virtual ensure(deadline)
	{
		// Calling the factory is cheaper than calculating the address, and removeLiquidity can only be done on existing pairs.
		// SafeERC20.safeTransferFrom(path[0], _msgSender(), ExofiswapLibrary.pairFor(_swapFactory, path[0], path[1]), amountIn);
		SafeERC20.safeTransferFrom(path[0], _msgSender(), address(_swapFactory.getPair(path[0], path[1])), amountIn);
		uint256 lastItem = MathUInt256.unsafeDec(path.length);
		uint256 balanceBefore = path[lastItem].balanceOf(to);
		_swapSupportingFeeOnTransferTokens(path, to);
		require((path[lastItem].balanceOf(to) - balanceBefore) >= amountOutMin, "ER: INSUFFICIENT_OUTPUT_AMOUNT");
	}

	function swapExactETHForTokensSupportingFeeOnTransferTokens(
		uint256 amountOutMin,
		IERC20Metadata[] calldata path,
		address to,
		uint256 deadline
	) override external virtual payable ensure(deadline)
	{
		require(path[0] == _wrappedEth, "ER: INVALID_PATH");
		uint256 amountIn = msg.value;
		_wrappedEth.deposit{value: amountIn}();
		assert(_wrappedEth.transfer(address(_swapFactory.getPair(path[0], path[1])), amountIn));
		uint256 lastItem = MathUInt256.unsafeDec(path.length);
		uint256 balanceBefore = path[lastItem].balanceOf(to);
		_swapSupportingFeeOnTransferTokens(path, to);
		require(path[lastItem].balanceOf(to) - balanceBefore >= amountOutMin, "ER: INSUFFICIENT_OUTPUT_AMOUNT");
	}

	function factory() override external view returns (IExofiswapFactory)
	{
		return _swapFactory;
	}

	function getAmountsIn(uint amountOut, IERC20Metadata[] memory path) override
		public view virtual returns (uint[] memory amounts)
	{
		return ExofiswapLibrary.getAmountsIn(_swapFactory, amountOut, path);
	}

	// solhint-disable-next-line func-name-mixedcase
	function WETH() override public view returns(IERC20Metadata)
	{
		return _wrappedEth;
	}

	function getAmountsOut(uint256 amountIn, IERC20Metadata[] memory path) override
		public view virtual returns (uint256[] memory amounts)
	{
		return ExofiswapLibrary.getAmountsOut(_swapFactory, amountIn, path);
	}

	function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut) override
		public pure virtual returns (uint amountIn)
	{
		return ExofiswapLibrary.getAmountIn(amountOut, reserveIn, reserveOut);
	}

	function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) override
		public pure virtual returns (uint256)
	{
		return ExofiswapLibrary.getAmountOut(amountIn, reserveIn, reserveOut);
	}

	function quote(uint256 amount, uint256 reserve0, uint256 reserve1) override public pure virtual returns (uint256)
	{
		return ExofiswapLibrary.quote(amount, reserve0, reserve1);
	}

	function _addLiquidity(
		IERC20Metadata tokenA,
		IERC20Metadata tokenB,
		uint256 amountADesired,
		uint256 amountBDesired,
		uint256 amountAMin,
		uint256 amountBMin
	) private returns (uint256, uint256, IExofiswapPair)
	{
		// create the pair if it doesn't exist yet
		IExofiswapPair pair = _swapFactory.getPair(tokenA, tokenB);
		if (address(pair) == address(0))
		{
			pair = _swapFactory.createPair(tokenA, tokenB);
		}
		(uint256 reserveA, uint256 reserveB, ) = pair.getReserves();
		if (reserveA == 0 && reserveB == 0)
		{
			return (amountADesired, amountBDesired, pair);
		}
		if(pair.token0() == tokenB)
		{
			(reserveB, reserveA) = (reserveA, reserveB);
		}
		uint256 amountBOptimal = ExofiswapLibrary.quote(amountADesired, reserveA, reserveB);
		if (amountBOptimal <= amountBDesired)
		{
			require(amountBOptimal >= amountBMin, "ER: INSUFFICIENT_B_AMOUNT");
			return (amountADesired, amountBOptimal, pair);
		}
		uint256 amountAOptimal = ExofiswapLibrary.quote(amountBDesired, reserveB, reserveA);
		assert(amountAOptimal <= amountADesired);
		require(amountAOptimal >= amountAMin, "ER: INSUFFICIENT_A_AMOUNT");
		return (amountAOptimal, amountBDesired, pair);
	}

	function _removeLiquidity(
	IExofiswapPair pair,
	bool reverse,
	uint256 liquidity,
	uint256 amountAMin,
	uint256 amountBMin,
	address to
	) private returns (uint256 amountA, uint256 amountB)
	{
		pair.transferFrom(_msgSender(), address(pair), liquidity); // send liquidity to pair
		(amountA, amountB) = pair.burn(to);
		if(reverse)
		{
			(amountA, amountB) = (amountB, amountA);
		}
		require(amountA >= amountAMin, "ER: INSUFFICIENT_A_AMOUNT");
		require(amountB >= amountBMin, "ER: INSUFFICIENT_B_AMOUNT");
	}

	function _safeTransferFrom(IERC20Metadata tokenA, IERC20Metadata tokenB, address pair, uint256 amountA, uint256 amountB) private
	{
		address sender = _msgSender();
		SafeERC20.safeTransferFrom(tokenA, sender, pair, amountA);
		SafeERC20.safeTransferFrom(tokenB, sender, pair, amountB);
	}

	// requires the initial amount to have already been sent to the first pair
	function _swap(uint256[] memory amounts, IERC20Metadata[] memory path, address to) private
	{
		uint256 pathLengthSubOne = MathUInt256.unsafeDec(path.length);
		uint256 pathLengthSubTwo = MathUInt256.unsafeDec(pathLengthSubOne);
		uint256 j;
		for (uint256 i; i < pathLengthSubOne; i = j)
		{
			j = MathUInt256.unsafeInc(i);
			IExofiswapPair pair = _swapFactory.getPair(path[i], path[j]);
			uint256 amountOut = amounts[j];
			(uint256 amount0Out, uint256 amount1Out) = path[i] == pair.token0() ? (uint256(0), amountOut) : (amountOut, uint256(0));
			address target = i < pathLengthSubTwo ? address(ExofiswapLibrary.pairFor(_swapFactory, path[j], path[MathUInt256.unsafeInc(j)])) : to;
			pair.swap(amount0Out, amount1Out, target, new bytes(0));
		}
	}

	function _swapSupportingFeeOnTransferTokens(IERC20Metadata[] memory path, address to) private
	{
		uint256 pathLengthSubOne = MathUInt256.unsafeDec(path.length);
		uint256 pathLengthSubTwo = MathUInt256.unsafeDec(pathLengthSubOne);
		uint256 j;
		for (uint256 i; i < pathLengthSubOne; i = j)
		{
			j = MathUInt256.unsafeInc(i);
			IExofiswapPair pair = _swapFactory.getPair(path[i], path[j]);
			uint256 amountInput;
			uint256 amountOutput;
			IERC20Metadata token0 = pair.token0();
			{ // scope to avoid stack too deep errors
				(uint256 reserveInput, uint reserveOutput,) = pair.getReserves();
				if (path[j] == token0)
				{
					(reserveInput, reserveOutput) = (reserveOutput, reserveInput);
				}
				amountInput = (path[i].balanceOf(address(pair)) - reserveInput);
				amountOutput = ExofiswapLibrary.getAmountOut(amountInput, reserveInput, reserveOutput);
			}
			(uint256 amount0Out, uint256 amount1Out) = path[i] == token0 ? (uint256(0), amountOutput) : (amountOutput, uint256(0));
			address receiver = i < pathLengthSubTwo ? address(_swapFactory.getPair(path[j], path[MathUInt256.unsafeInc(j)])): to;
			pair.swap(amount0Out, amount1Out, receiver, new bytes(0));
		}
	}
}

	// // **** REMOVE LIQUIDITY (supporting fee-on-transfer tokens) ****

	// // **** SWAP ****

	
	// function swapTokensForExactTokens(
	// 	uint amountOut,
	// 	uint amountInMax,
	// 	address[] calldata path,
	// 	address to,
	// 	uint deadline
	// ) external virtual override ensure(deadline) returns (uint[] memory amounts) {
	// 	amounts = UniswapV2Library.getAmountsIn(factory, amountOut, path);
	// 	require(amounts[0] <= amountInMax, 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT');
	// 	TransferHelper.safeTransferFrom(
	// 		path[0], _msgSender(), UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]
	// 	);
	// 	_swap(amounts, path, to);
	// }
	// function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
	// 	external
	// 	virtual
	// 	override
	// 	payable
	// 	ensure(deadline)
	// 	returns (uint[] memory amounts)
	// {
	// 	require(path[0] == WETH, 'UniswapV2Router: INVALID_PATH');
	// 	amounts = UniswapV2Library.getAmountsOut(factory, msg.value, path);
	// 	require(amounts[amounts.length - 1] >= amountOutMin, 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');
	// 	IWETH(WETH).deposit{value: amounts[0]}();
	// 	assert(IWETH(WETH).transfer(UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]));
	// 	_swap(amounts, path, to);
	// }
	// function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
	// 	external
	// 	virtual
	// 	override
	// 	ensure(deadline)
	// 	returns (uint[] memory amounts)
	// {
	// 	require(path[path.length - 1] == WETH, 'UniswapV2Router: INVALID_PATH');
	// 	amounts = UniswapV2Library.getAmountsIn(factory, amountOut, path);
	// 	require(amounts[0] <= amountInMax, 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT');
	// 	TransferHelper.safeTransferFrom(
	// 		path[0], _msgSender(), UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]
	// 	);
	// 	_swap(amounts, path, address(this));
	// 	IWETH(WETH).withdraw(amounts[amounts.length - 1]);
	// 	TransferHelper.safeTransferETH(to, amounts[amounts.length - 1]);
	// }
	// function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
	// 	external
	// 	virtual
	// 	override
	// 	ensure(deadline)
	// 	returns (uint[] memory amounts)
	// {
	// 	require(path[path.length - 1] == WETH, 'UniswapV2Router: INVALID_PATH');
	// 	amounts = UniswapV2Library.getAmountsOut(factory, amountIn, path);
	// 	require(amounts[amounts.length - 1] >= amountOutMin, 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');
	// 	TransferHelper.safeTransferFrom(
	// 		path[0], _msgSender(), UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]
	// 	);
	// 	_swap(amounts, path, address(this));
	// 	IWETH(WETH).withdraw(amounts[amounts.length - 1]);
	// 	TransferHelper.safeTransferETH(to, amounts[amounts.length - 1]);
	// }
	// function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline)
	// 	external
	// 	virtual
	// 	override
	// 	payable
	// 	ensure(deadline)
	// 	returns (uint[] memory amounts)
	// {
	// 	require(path[0] == WETH, 'UniswapV2Router: INVALID_PATH');
	// 	amounts = UniswapV2Library.getAmountsIn(factory, amountOut, path);
	// 	require(amounts[0] <= msg.value, 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT');
	// 	IWETH(WETH).deposit{value: amounts[0]}();
	// 	assert(IWETH(WETH).transfer(UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]));
	// 	_swap(amounts, path, to);
	// 	// refund dust eth, if any
	// 	if (msg.value > amounts[0]) TransferHelper.safeTransferETH(_msgSender(), msg.value - amounts[0]);
	// }

	// // **** SWAP (supporting fee-on-transfer tokens) ****
	// // requires the initial amount to have already been sent to the first pair
	// function _swapSupportingFeeOnTransferTokens(address[] memory path, address _to) internal virtual {
	// 	for (uint i; i < path.length - 1; i++) {
	// 		(address input, address output) = (path[i], path[i + 1]);
	// 		(address token0,) = UniswapV2Library.sortTokens(input, output);
	// 		IUniswapV2Pair pair = IUniswapV2Pair(UniswapV2Library.pairFor(factory, input, output));
	// 		uint amountInput;
	// 		uint amountOutput;
	// 		{ // scope to avoid stack too deep errors
	// 		(uint reserve0, uint reserve1,) = pair.getReserves();
	// 		(uint reserveInput, uint reserveOutput) = input == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
	// 		amountInput = IERC20Uniswap(input).balanceOf(address(pair)).sub(reserveInput);
	// 		amountOutput = UniswapV2Library.getAmountOut(amountInput, reserveInput, reserveOutput);
	// 		}
	// 		(uint amount0Out, uint amount1Out) = input == token0 ? (uint(0), amountOutput) : (amountOutput, uint(0));
	// 		address to = i < path.length - 2 ? UniswapV2Library.pairFor(factory, output, path[i + 2]) : _to;
	// 		pair.swap(amount0Out, amount1Out, to, new bytes(0));
	// 	}
	// }