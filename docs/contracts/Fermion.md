---
filename: /contracts/Fermion
type: contract
---

## Fermion

_Implementation of the {IFermion} interface.
The IFermion interface extends the IERC20, IERC20Metadata, IERC20Burnable, IOwnable interfaces._

***

### Implements

- [Context](/@exoda/exoda-contracts/contracts/utils/Context)
- [ERC20](/@exoda/exoda-contracts/contracts/token/ERC20/ERC20)
- [ERC20Burnable](/@exoda/exoda-contracts/contracts/token/ERC20/extensions/ERC20Burnable)
- [IERC20](/@exoda/exoda-contracts/contracts/interfaces/token/ERC20/IERC20)
- [IERC20AltApprove](/@exoda/exoda-contracts/contracts/interfaces/token/ERC20/extensions/IERC20AltApprove)
- [IERC20Burnable](/@exoda/exoda-contracts/contracts/interfaces/token/ERC20/extensions/IERC20Burnable)
- [IERC20Metadata](/@exoda/exoda-contracts/contracts/interfaces/token/ERC20/extensions/IERC20Metadata)
- [IFermion](/contracts/interfaces/IFermion)
- [IOwnable](/@exoda/exoda-contracts/contracts/interfaces/access/IOwnable)
- [Ownable](/@exoda/exoda-contracts/contracts/access/Ownable)

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

#### OwnershipTransferred

```solidity
event OwnershipTransferred(address previousOwner, address newOwner)
```

Emitted when ownership is moved from one address to another.

| Name | Type | Indexed | Description |
| ---- | ---- | ------- | ----------- |
| previousOwner | address | true | (indexed) The owner of the contract until now. |
| newOwner | address | true | (indexed) The new owner of the contract. |

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

#### constructor

```solidity
constructor() public
```

#### burn

```solidity
function burn(uint256 amount) public
```

Destroys `amount` tokens from the caller.

#### burnFrom

```solidity
function burnFrom(address account, uint256 amount) public
```

Destroys `amount` tokens from `account`, deducting from the caller's allowance.

#### mint

```solidity
function mint(address to, uint256 amount) public
```

Creates `amount` token to `to`. Must only be called by the owner (MagneticFieldGenerator).

[Back](/index)