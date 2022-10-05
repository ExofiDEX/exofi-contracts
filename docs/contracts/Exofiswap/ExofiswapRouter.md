---
filename: /contracts/Exofiswap/ExofiswapRouter
type: contract
---

## ExofiswapRouter

***

### Implements

- [Context](/@exoda/contracts/utils/Context)
- [IExofiswapRouter](/contracts/Exofiswap/interfaces/IExofiswapRouter)

***

### Functions

#### constructor

```solidity
constructor(contract IExofiswapFactory swapFactory, contract IWETH9 wrappedEth) public
```

#### receive

```solidity
receive() external payable
```

#### addLiquidityETH

```solidity
function addLiquidityETH(contract IERC20Metadata token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) external payable virtual returns (uint256 amountToken, uint256 amountETH, uint256 liquidity)
```

#### addLiquidity

```solidity
function addLiquidity(contract IERC20Metadata tokenA, contract IERC20Metadata tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external virtual returns (uint256 amountA, uint256 amountB, uint256 liquidity)
```

#### removeLiquidity

```solidity
function removeLiquidity(contract IERC20Metadata tokenA, contract IERC20Metadata tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external virtual returns (uint256, uint256)
```

#### removeLiquidityETH

```solidity
function removeLiquidityETH(contract IERC20Metadata token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) external virtual returns (uint256 amountToken, uint256 amountETH)
```

#### removeLiquidityETHSupportingFeeOnTransferTokens

```solidity
function removeLiquidityETHSupportingFeeOnTransferTokens(contract IERC20Metadata token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) external virtual returns (uint256 amountETH)
```

#### removeLiquidityETHWithPermit

```solidity
function removeLiquidityETHWithPermit(contract IERC20Metadata token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) external virtual returns (uint256 amountToken, uint256 amountETH)
```

#### removeLiquidityETHWithPermitSupportingFeeOnTransferTokens

```solidity
function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(contract IERC20Metadata token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) external virtual returns (uint256 amountETH)
```

#### removeLiquidityWithPermit

```solidity
function removeLiquidityWithPermit(contract IERC20Metadata tokenA, contract IERC20Metadata tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) external virtual returns (uint256 amountA, uint256 amountB)
```

#### swapExactTokensForETH

```solidity
function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, contract IERC20Metadata[] path, address to, uint256 deadline) external virtual returns (uint256[] amounts)
```

#### swapExactTokensForETHSupportingFeeOnTransferTokens

```solidity
function swapExactTokensForETHSupportingFeeOnTransferTokens(uint256 amountIn, uint256 amountOutMin, contract IERC20Metadata[] path, address to, uint256 deadline) external virtual
```

#### swapExactTokensForTokens

```solidity
function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, contract IERC20Metadata[] path, address to, uint256 deadline) external virtual returns (uint256[] amounts)
```

#### swapExactTokensForTokensSupportingFeeOnTransferTokens

```solidity
function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256 amountIn, uint256 amountOutMin, contract IERC20Metadata[] path, address to, uint256 deadline) external virtual
```

#### swapTokensForExactETH

```solidity
function swapTokensForExactETH(uint256 amountOut, uint256 amountInMax, contract IERC20Metadata[] path, address to, uint256 deadline) external virtual returns (uint256[] amounts)
```

#### swapTokensForExactTokens

```solidity
function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, contract IERC20Metadata[] path, address to, uint256 deadline) external virtual returns (uint256[] amounts)
```

#### swapETHForExactTokens

```solidity
function swapETHForExactTokens(uint256 amountOut, contract IERC20Metadata[] path, address to, uint256 deadline) external payable virtual returns (uint256[] amounts)
```

#### swapExactETHForTokens

```solidity
function swapExactETHForTokens(uint256 amountOutMin, contract IERC20Metadata[] path, address to, uint256 deadline) external payable virtual returns (uint256[] amounts)
```

#### swapExactETHForTokensSupportingFeeOnTransferTokens

```solidity
function swapExactETHForTokensSupportingFeeOnTransferTokens(uint256 amountOutMin, contract IERC20Metadata[] path, address to, uint256 deadline) external payable virtual
```

#### factory

```solidity
function factory() external view returns (contract IExofiswapFactory)
```

#### getAmountsIn

```solidity
function getAmountsIn(uint256 amountOut, contract IERC20Metadata[] path) public view virtual returns (uint256[] amounts)
```

#### WETH

```solidity
function WETH() public view returns (contract IERC20Metadata)
```

#### getAmountsOut

```solidity
function getAmountsOut(uint256 amountIn, contract IERC20Metadata[] path) public view virtual returns (uint256[] amounts)
```

#### getAmountIn

```solidity
function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut) public pure virtual returns (uint256 amountIn)
```

#### getAmountOut

```solidity
function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure virtual returns (uint256)
```

#### quote

```solidity
function quote(uint256 amount, uint256 reserve0, uint256 reserve1) public pure virtual returns (uint256)
```

[Back](/index)