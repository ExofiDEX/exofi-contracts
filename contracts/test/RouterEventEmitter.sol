// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../Exofiswap/interfaces/IExofiswapRouter.sol";

interface IRouterEventEmitter
{
    receive() external payable;
    function swapExactTokensForTokens(
        IExofiswapRouter router,
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
    function swapTokensForExactTokens(
        IExofiswapRouter router,
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
    function swapExactETHForTokens(
        IExofiswapRouter router,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable;
    function swapTokensForExactETH(
        IExofiswapRouter router,
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
    function swapExactTokensForETH(
        IExofiswapRouter router,
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
    function swapETHForExactTokens(
        IExofiswapRouter router,
        uint amountOut,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable;
}

contract RouterEventEmitter is IRouterEventEmitter {
    event Amounts(uint[] amounts);

    receive() override external payable {} // solhint-disable-line no-empty-blocks

    function swapExactTokensForTokens(
        IExofiswapRouter router,
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) override external {
        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory returnData) = address(router).delegatecall(abi.encodeWithSelector(
            router.swapExactTokensForTokens.selector, amountIn, amountOutMin, path, to, deadline
        ));
        assert(success);
        emit Amounts(abi.decode(returnData, (uint[])));
    }

    function swapTokensForExactTokens(
        IExofiswapRouter router,
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) override external {
        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory returnData) = address(router).delegatecall(abi.encodeWithSelector(
            router.swapTokensForExactTokens.selector, amountOut, amountInMax, path, to, deadline
        ));
        assert(success);
        emit Amounts(abi.decode(returnData, (uint[])));
    }

    function swapExactETHForTokens(
        IExofiswapRouter router,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) override external payable {
        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory returnData) = address(router).delegatecall(abi.encodeWithSelector(
            router.swapExactETHForTokens.selector, amountOutMin, path, to, deadline
        ));
        assert(success);
        emit Amounts(abi.decode(returnData, (uint[])));
    }

    function swapTokensForExactETH(
        IExofiswapRouter router,
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) override external {
        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory returnData) = address(router).delegatecall(abi.encodeWithSelector(
            router.swapTokensForExactETH.selector, amountOut, amountInMax, path, to, deadline
        ));
        assert(success);
        emit Amounts(abi.decode(returnData, (uint[])));
    }

    function swapExactTokensForETH(
        IExofiswapRouter router,
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) override external {
        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory returnData) = address(router).delegatecall(abi.encodeWithSelector(
            router.swapExactTokensForETH.selector, amountIn, amountOutMin, path, to, deadline
        ));
        assert(success);
        emit Amounts(abi.decode(returnData, (uint[])));
    }

    function swapETHForExactTokens(
        IExofiswapRouter router,
        uint amountOut,
        address[] calldata path,
        address to,
        uint deadline
    ) override external payable {
        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory returnData) = address(router).delegatecall(abi.encodeWithSelector(
            router.swapETHForExactTokens.selector, amountOut, path, to, deadline
        ));
        assert(success);
        emit Amounts(abi.decode(returnData, (uint[])));
    }
}
