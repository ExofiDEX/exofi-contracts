---
filename: /contracts/UniqueAddressList
type: contract
---

## UniqueAddressList

***

### Implements

- [IUniqueAddressList](/contracts/interfaces/IUniqueAddressList)

***

### Functions

#### constructor

```solidity
constructor() public
```

#### add

```solidity
function add(address entry) public
```

#### remove

```solidity
function remove(address entry) public
```

#### indexOf

```solidity
function indexOf(address entry) public view returns (uint256)
```

#### peek

```solidity
function peek(uint256 index) public view returns (address)
```

[Back](/index)