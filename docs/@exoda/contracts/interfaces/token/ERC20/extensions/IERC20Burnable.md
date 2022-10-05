---
filename: /@exoda/contracts/interfaces/token/ERC20/extensions/IERC20Burnable
type: interface
---

## IERC20Burnable

Interface for the extension of {ERC20} that allows token holders to destroy both their own tokens
and those that they have an allowance for.

***

### Implements

- [IERC20](/@exoda/contracts/interfaces/token/ERC20/IERC20)

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
function burn(uint256 amount) external
```

Destroys {amount} tokens from the caller.

Emits an {Transfer} event.

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | The {amount} of tokens that should be destroyed. |

#### burnFrom

```solidity
function burnFrom(address account, uint256 amount) external
```

Destroys {amount} tokens from {account}, deducting from the caller's allowance.

Emits an {Approval} and an {Transfer} event.

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The {account} where the tokens should be destroyed. |
| amount | uint256 | The {amount} of tokens that should be destroyed. |

[Back](/index)