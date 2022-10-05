---
filename: /contracts/Exofiswap/interfaces/IWETH9
type: interface
---

## IWETH9

***

### Implements

- [IERC20](/@exoda/contracts/interfaces/token/ERC20/IERC20)
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

#### Deposit

```solidity
event Deposit(address from, uint256 value)
```

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

#### Withdraw

```solidity
event Withdraw(address to, uint256 value)
```

***

### Functions

#### deposit

```solidity
function deposit() external payable
```

#### withdraw

```solidity
function withdraw(uint256 value) external
```

[Back](/index)