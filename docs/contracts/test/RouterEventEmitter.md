---
filename: /contracts/test/RouterEventEmitter
type: interface
---

## IRouterEventEmitter

***

### Functions

#### receive

```solidity
receive() external payable
```

#### swapExactTokensForTokens

```solidity
function swapExactTokensForTokens(contract IExofiswapRouter router, uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external
```

#### swapTokensForExactTokens

```solidity
function swapTokensForExactTokens(contract IExofiswapRouter router, uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) external
```

#### swapExactETHForTokens

```solidity
function swapExactETHForTokens(contract IExofiswapRouter router, uint256 amountOutMin, address[] path, address to, uint256 deadline) external payable
```

#### swapTokensForExactETH

```solidity
function swapTokensForExactETH(contract IExofiswapRouter router, uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) external
```

#### swapExactTokensForETH

```solidity
function swapExactTokensForETH(contract IExofiswapRouter router, uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external
```

#### swapETHForExactTokens

```solidity
function swapETHForExactTokens(contract IExofiswapRouter router, uint256 amountOut, address[] path, address to, uint256 deadline) external payable
```

---
filename: /contracts/test/RouterEventEmitter
type: contract
---

## RouterEventEmitter

***

### Implements

- [IRouterEventEmitter](/contracts/test/RouterEventEmitter)

***

### Events

#### Amounts

```solidity
event Amounts(uint256[] amounts)
```

***

### Functions

#### receive

```solidity
receive() external payable
```

#### swapExactTokensForTokens

```solidity
function swapExactTokensForTokens(contract IExofiswapRouter router, uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external
```

#### swapTokensForExactTokens

```solidity
function swapTokensForExactTokens(contract IExofiswapRouter router, uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) external
```

#### swapExactETHForTokens

```solidity
function swapExactETHForTokens(contract IExofiswapRouter router, uint256 amountOutMin, address[] path, address to, uint256 deadline) external payable
```

#### swapTokensForExactETH

```solidity
function swapTokensForExactETH(contract IExofiswapRouter router, uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) external
```

#### swapExactTokensForETH

```solidity
function swapExactTokensForETH(contract IExofiswapRouter router, uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external
```

#### swapETHForExactTokens

```solidity
function swapETHForExactTokens(contract IExofiswapRouter router, uint256 amountOut, address[] path, address to, uint256 deadline) external payable
```

[Back](/index)