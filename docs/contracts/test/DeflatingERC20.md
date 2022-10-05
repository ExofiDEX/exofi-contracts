---
filename: /contracts/test/DeflatingERC20
type: interface
---

## IDeflatingERC20

***

### Functions

#### approve

```solidity
function approve(address spender, uint256 value) external returns (bool)
```

#### transfer

```solidity
function transfer(address to, uint256 value) external returns (bool)
```

#### transferFrom

```solidity
function transferFrom(address from, address to, uint256 value) external returns (bool)
```

#### permit

```solidity
function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external
```

---
filename: /contracts/test/DeflatingERC20
type: contract
---

## DeflatingERC20

***

### Implements

- [IDeflatingERC20](/contracts/test/DeflatingERC20)

***

### Events

#### Approval

```solidity
event Approval(address owner, address spender, uint256 value)
```

#### Transfer

```solidity
event Transfer(address from, address to, uint256 value)
```

***

### Functions

#### constructor

```solidity
constructor(uint256 totalSupply_) public
```

#### approve

```solidity
function approve(address spender, uint256 value) external returns (bool)
```

#### transfer

```solidity
function transfer(address to, uint256 value) external returns (bool)
```

#### transferFrom

```solidity
function transferFrom(address from, address to, uint256 value) external returns (bool)
```

#### permit

```solidity
function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external
```

#### _mint

```solidity
function _mint(address to, uint256 value) internal
```

#### _burn

```solidity
function _burn(address from, uint256 value) internal
```

[Back](/index)