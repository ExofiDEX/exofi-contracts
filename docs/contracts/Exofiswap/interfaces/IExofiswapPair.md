---
filename: /contracts/Exofiswap/interfaces/IExofiswapPair
type: interface
---

## IExofiswapPair

***

### Implements

- [IERC20](/@exoda/contracts/interfaces/token/ERC20/IERC20)
- [IERC20AltApprove](/@exoda/contracts/interfaces/token/ERC20/extensions/IERC20AltApprove)
- [IERC20Metadata](/@exoda/contracts/interfaces/token/ERC20/extensions/IERC20Metadata)
- [IExofiswapERC20](/contracts/Exofiswap/interfaces/IExofiswapERC20)

***

### Events

#### Approval

```solidity
event Approval(address owner, address spender, uint256 value)
```

Emitted when the allowance of a {spender} for an {owner} is set to a new value.

NOTE: {value} may be zero.

| Name | Type | Indexed | Description |
| ---- | ---- | ------- | ----------- |
| owner | address | true | (indexed) The owner of the tokens. |
| spender | address | true | (indexed) The spender for the tokens. |
| value | uint256 | false | The amount of tokens that got an allowance. |

#### Burn

```solidity
event Burn(address sender, uint256 amount0, uint256 amount1, address to)
```

#### Mint

```solidity
event Mint(address sender, uint256 amount0, uint256 amount1)
```

#### Swap

```solidity
event Swap(address sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address to)
```

#### Sync

```solidity
event Sync(uint112 reserve0, uint112 reserve1)
```

#### Transfer

```solidity
event Transfer(address from, address to, uint256 value)
```

Emitted when {value} tokens are moved from one address {from} to another {to}.

NOTE: {value} may be zero.

| Name | Type | Indexed | Description |
| ---- | ---- | ------- | ----------- |
| from | address | true | (indexed) The origin of the transfer. |
| to | address | true | (indexed) The target of the transfer. |
| value | uint256 | false | The amount of tokens that got transfered. |

***

### Functions

#### burn

```solidity
function burn(address to) external returns (uint256 amount0, uint256 amount1)
```

#### initialize

```solidity
function initialize(contract IERC20Metadata token0Init, contract IERC20Metadata token1Init) external
```

#### mint

```solidity
function mint(address to) external returns (uint256 liquidity)
```

#### skim

```solidity
function skim(address to) external
```

#### swap

```solidity
function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes data) external
```

#### sync

```solidity
function sync() external
```

#### factory

```solidity
function factory() external view returns (contract IExofiswapFactory)
```

#### getReserves

```solidity
function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)
```

#### kLast

```solidity
function kLast() external view returns (uint256)
```

#### price0CumulativeLast

```solidity
function price0CumulativeLast() external view returns (uint256)
```

#### price1CumulativeLast

```solidity
function price1CumulativeLast() external view returns (uint256)
```

#### token0

```solidity
function token0() external view returns (contract IERC20Metadata)
```

#### token1

```solidity
function token1() external view returns (contract IERC20Metadata)
```

#### MINIMUM_LIQUIDITY

```solidity
function MINIMUM_LIQUIDITY() external pure returns (uint256)
```

[Back](/index)