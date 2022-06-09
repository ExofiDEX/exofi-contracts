---
filename: /@exoda/exoda-contracts/contracts/interfaces/access/IOwnable
type: interface
---

## IOwnable

This interface contains all visible functions and events for the Ownable contract module.

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

#### renounceOwnership

```solidity
function renounceOwnership() external
```

Leaves the contract without an owner. It will not be possible to call {onlyOwner} functions anymore.

NOTE: Renouncing ownership will leave the contract without an owner,
thereby removing any functionality that is only available to the owner.

Emits an [`OwnershipTransferred`](#ownershiptransferred) event indicating the renounced ownership.

Requirements:
- Can only be called by the current owner.

_Sets the zero address as the new contract owner._

#### transferOwnership

```solidity
function transferOwnership(address newOwner) external
```

Transfers ownership of the contract to a new address.

Emits an [`OwnershipTransferred`](#ownershiptransferred) event indicating the transfered ownership.

Requirements:
- Can only be called by the current owner.

| Name | Type | Description |
| ---- | ---- | ----------- |
| newOwner | address | The new owner of the contract. |

#### owner

```solidity
function owner() external view returns (address)
```

Returns the current owner.

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | The current owner. |

[Back](/index)