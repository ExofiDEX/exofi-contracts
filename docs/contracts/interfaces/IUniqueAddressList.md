---
filename: /contracts/interfaces/IUniqueAddressList
type: interface
---

## IUniqueAddressList

***

### Functions

#### add

```solidity
function add(address newEntry) external
```

#### remove

```solidity
function remove(address entry) external
```

#### indexOf

```solidity
function indexOf(address entry) external view returns (uint256)
```

#### peek

```solidity
function peek(uint256 index) external view returns (address)
```

[Back](/index)