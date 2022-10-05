---
filename: /contracts/Exofiswap/ExofiswapERC20
type: contract
---

## ExofiswapERC20

***

### Implements

- [Context](/@exoda/contracts/utils/Context)
- [ERC20](/@exoda/contracts/token/ERC20/ERC20)
- [IERC20](/@exoda/contracts/interfaces/token/ERC20/IERC20)
- [IERC20AltApprove](/@exoda/contracts/interfaces/token/ERC20/extensions/IERC20AltApprove)
- [IERC20Metadata](/@exoda/contracts/interfaces/token/ERC20/extensions/IERC20Metadata)
- [IExofiswapERC20](/contracts/Exofiswap/interfaces/IExofiswapERC20)

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
constructor(string tokenName) public
```

#### permit

```solidity
function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) public
```

#### DOMAIN_SEPARATOR

```solidity
function DOMAIN_SEPARATOR() public view returns (bytes32)
```

#### nonces

```solidity
function nonces(address owner) public view returns (uint256)
```

#### PERMIT_TYPEHASH

```solidity
function PERMIT_TYPEHASH() public pure returns (bytes32)
```

[Back](/index)