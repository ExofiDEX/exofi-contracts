---
filename: /contracts/Exofiswap/libraries/ExofiswapLibrary
type: library
---

## ExofiswapLibrary

***

### Functions

#### safeTransferETH

```solidity
function safeTransferETH(address to, uint256 value) internal
```

#### getAmountsIn

```solidity
function getAmountsIn(contract IExofiswapFactory factory, uint256 amountOut, contract IERC20Metadata[] path) internal view returns (uint256[] amounts)
```

#### getAmountsOut

```solidity
function getAmountsOut(contract IExofiswapFactory factory, uint256 amountIn, contract IERC20Metadata[] path) internal view returns (uint256[] amounts)
```

#### getReserves

```solidity
function getReserves(contract IExofiswapFactory factory, contract IERC20Metadata token0, contract IERC20Metadata token1) internal view returns (uint256, uint256)
```

#### pairFor

```solidity
function pairFor(contract IExofiswapFactory factory, contract IERC20Metadata token0, contract IERC20Metadata token1) internal pure returns (contract IExofiswapPair)
```

#### getAmountIn

```solidity
function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut) internal pure returns (uint256 amountIn)
```

#### getAmountOut

```solidity
function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) internal pure returns (uint256)
```

#### quote

```solidity
function quote(uint256 amount, uint256 reserve0, uint256 reserve1) internal pure returns (uint256)
```

#### sortTokens

```solidity
function sortTokens(contract IERC20Metadata token0, contract IERC20Metadata token1) internal pure returns (contract IERC20Metadata tokenL, contract IERC20Metadata tokenR)
```

[Back](/index)