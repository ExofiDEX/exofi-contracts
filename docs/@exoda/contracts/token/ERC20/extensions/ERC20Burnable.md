---
filename: /@exoda/contracts/token/ERC20/extensions/ERC20Burnable
type: contract
---

## ERC20Burnable

Extension of {ERC20} that allows token holders to destroy both their own
tokens and those that they have an allowance for, in a way that can be
recognized off-chain (via event analysis).

***

### Implements

- [Context](/@exoda/contracts/utils/Context)
- [ERC20](/@exoda/contracts/token/ERC20/ERC20)
- [IERC20](/@exoda/contracts/interfaces/token/ERC20/IERC20)
- [IERC20AltApprove](/@exoda/contracts/interfaces/token/ERC20/extensions/IERC20AltApprove)
- [IERC20Burnable](/@exoda/contracts/interfaces/token/ERC20/extensions/IERC20Burnable)
- [IERC20Metadata](/@exoda/contracts/interfaces/token/ERC20/extensions/IERC20Metadata)

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

#### constructor

```solidity
constructor(string tokenName, string tokenSymbol) public
```

Sets the values for {name} and {symbol}.

The default value of {decimals} is 18. To select a different value for
{decimals} you should overload it.

All two of these values are immutable: they can only be set once during
construction.

#### burn

```solidity
function burn(uint256 amount) public virtual
```

Destroys `amount` tokens from the caller.

See {ERC20-_burn}.

#### burnFrom

```solidity
function burnFrom(address account, uint256 amount) public virtual
```

Destroys `amount` tokens from `account`, deducting from the caller's allowance.

See {ERC20-_burn} and {ERC20-allowance}.

Requirements:
- the caller must have allowance for `account`'s tokens of at least `amount`.

[Back](/index)