---
filename: /contracts/test/WETH9
type: interface
---

## IWETH9

***

### Functions

#### deposit

```solidity
function deposit() external payable
```

#### withdraw

```solidity
function withdraw(uint256 wad) external
```

---
filename: /contracts/test/WETH9
type: contract
---

## WETH9

***

### Implements

- [IERC20](/@exoda/contracts/interfaces/token/ERC20/IERC20)
- [IWETH9](/contracts/test/WETH9)

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
event Deposit(address dst, uint256 wad)
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

#### Withdrawal

```solidity
event Withdrawal(address src, uint256 wad)
```

***

### Functions

#### deposit

```solidity
function deposit() public payable
```

#### withdraw

```solidity
function withdraw(uint256 wad) public
```

#### approve

```solidity
function approve(address guy, uint256 wad) public returns (bool)
```

#### transfer

```solidity
function transfer(address dst, uint256 wad) public returns (bool)
```

#### transferFrom

```solidity
function transferFrom(address src, address dst, uint256 wad) public returns (bool)
```

#### totalSupply

```solidity
function totalSupply() public view returns (uint256)
```

_Returns the amount of tokens in existence._

[Back](/index)