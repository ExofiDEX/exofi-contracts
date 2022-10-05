---
filename: /contracts/interfaces/IVortexLock
type: interface
---

## IVortexLock

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

***

### Functions

#### loadToken

```solidity
function loadToken(uint256 amount) external
```

#### die

```solidity
function die() external
```

#### addBeneficiary

```solidity
function addBeneficiary(address benefitary) external
```

#### claim

```solidity
function claim() external
```

#### getClaimableAmount

```solidity
function getClaimableAmount() external view returns (uint256)
```

[Back](/index)