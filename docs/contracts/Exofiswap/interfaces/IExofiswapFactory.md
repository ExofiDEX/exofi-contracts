---
filename: /contracts/Exofiswap/interfaces/IExofiswapFactory
type: interface
---

## IExofiswapFactory

***

### Implements

- [IOwnable](/@exoda/contracts/interfaces/access/IOwnable)

***

### Events

#### OwnershipTransferred

```solidity
event OwnershipTransferred(address previousOwner, address newOwner)
```

Emitted when ownership is moved from one address to another.

| Name | Type | Indexed | Description |
| ---- | ---- | ------- | ----------- |
| previousOwner | address | true | (indexed) The owner of the contract until now. |
| newOwner | address | true | (indexed) The new owner of the contract. |

#### PairCreated

```solidity
event PairCreated(contract IERC20Metadata token0, contract IERC20Metadata token1, contract IExofiswapPair pair, uint256 pairCount)
```

***

### Functions

#### createPair

```solidity
function createPair(contract IERC20Metadata tokenA, contract IERC20Metadata tokenB) external returns (contract IExofiswapPair pair)
```

#### setFeeTo

```solidity
function setFeeTo(address) external
```

#### setMigrator

```solidity
function setMigrator(contract IMigrator) external
```

#### allPairs

```solidity
function allPairs(uint256 index) external view returns (contract IExofiswapPair)
```

#### allPairsLength

```solidity
function allPairsLength() external view returns (uint256)
```

#### feeTo

```solidity
function feeTo() external view returns (address)
```

#### getPair

```solidity
function getPair(contract IERC20Metadata tokenA, contract IERC20Metadata tokenB) external view returns (contract IExofiswapPair)
```

#### migrator

```solidity
function migrator() external view returns (contract IMigrator)
```

#### pairCodeHash

```solidity
function pairCodeHash() external pure returns (bytes32)
```

[Back](/index)