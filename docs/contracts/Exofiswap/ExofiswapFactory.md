---
filename: /contracts/Exofiswap/ExofiswapFactory
type: contract
---

## ExofiswapFactory

***

### Implements

- [Context](/@exoda/contracts/utils/Context)
- [IExofiswapFactory](/contracts/Exofiswap/interfaces/IExofiswapFactory)
- [IOwnable](/@exoda/contracts/interfaces/access/IOwnable)
- [Ownable](/@exoda/contracts/access/Ownable)

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

#### constructor

```solidity
constructor() public
```

#### createPair

```solidity
function createPair(contract IERC20Metadata tokenA, contract IERC20Metadata tokenB) public returns (contract IExofiswapPair)
```

#### setFeeTo

```solidity
function setFeeTo(address newFeeTo) public
```

#### setMigrator

```solidity
function setMigrator(contract IMigrator newMigrator) public
```

#### allPairs

```solidity
function allPairs(uint256 index) public view returns (contract IExofiswapPair)
```

#### allPairsLength

```solidity
function allPairsLength() public view returns (uint256)
```

#### feeTo

```solidity
function feeTo() public view returns (address)
```

#### getPair

```solidity
function getPair(contract IERC20Metadata tokenA, contract IERC20Metadata tokenB) public view returns (contract IExofiswapPair)
```

#### migrator

```solidity
function migrator() public view returns (contract IMigrator)
```

#### pairCodeHash

```solidity
function pairCodeHash() public pure returns (bytes32)
```

[Back](/index)