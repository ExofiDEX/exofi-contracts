---
filename: /@exoda/contracts/utils/Context
type: contract
---

## Context

Provides information about the current execution context, including the
sender of the transaction and its data. While these are generally available
via msg.sender and msg.data, they should not be accessed in such a direct
manner, since when dealing with meta-transactions the account sending and
paying for execution may not be the actual sender (as far as an application
is concerned).

This contract is only required for intermediate, library-like contracts.

***

### Functions

#### _msgSender

```solidity
function _msgSender() internal view virtual returns (address)
```

returns the sender of the transaction.

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | The sender of the transaction. |

#### _msgData

```solidity
function _msgData() internal view virtual returns (bytes)
```

returns the data of the transaction.

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes | The data of the transaction. |

[Back](/index)