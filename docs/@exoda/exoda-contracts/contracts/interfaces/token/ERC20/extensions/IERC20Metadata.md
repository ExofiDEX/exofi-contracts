---
filename: /@exoda/exoda-contracts/contracts/interfaces/token/ERC20/extensions/IERC20Metadata
type: interface
---

## IERC20Metadata

Interface for the optional metadata functions from the ERC20 standard.

***

### Implements

- [IERC20](/@exoda/exoda-contracts/contracts/interfaces/token/ERC20/IERC20)

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

#### name

```solidity
function name() external view returns (string)
```

Returns the name of the token.

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | The token name. |

#### symbol

```solidity
function symbol() external view returns (string)
```

Returns the symbol of the token.

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | The symbol for the token. |

#### decimals

```solidity
function decimals() external pure returns (uint8)
```

Returns the decimals of the token.

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint8 | The decimals for the token. |

[Back](/index)