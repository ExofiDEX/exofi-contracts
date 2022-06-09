---
filename: /@exoda/exoda-contracts/contracts/access/Ownable
type: contract
---

## Ownable

Contract module which provides a basic access control mechanism, where
there is an address (an owner) that can be granted exclusive access to specific functions.
By default, the owner account will be the one that deploys the contract. This
can later be changed with the function {transferOwnership(address newOwner)}".

_This module is used through inheritance. It will make available the modifier
{onlyOwner}, which can be applied to your functions to restrict their use to the owner._

***

### Implements

- [Context](/@exoda/exoda-contracts/contracts/utils/Context)
- [IOwnable](/@exoda/exoda-contracts/contracts/interfaces/access/IOwnable)

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

#### constructor

```solidity
constructor() public
```

Initializes the contract setting the deployer as the initial owner.

Emits an {OwnershipTransferred} event indicating the initially set ownership.

#### renounceOwnership

```solidity
function renounceOwnership() public virtual
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
function transferOwnership(address newOwner) public virtual
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
function owner() public view virtual returns (address)
```

Returns the current owner.

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | The current owner. |

#### _transferOwnership

```solidity
function _transferOwnership(address newOwner) internal virtual
```

Transfers ownership of the contract to a new address.
Internal function without access restriction.

Emits an {OwnershipTransferred} event indicating the transfered ownership.

[Back](/index)