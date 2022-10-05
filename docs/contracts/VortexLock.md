---
filename: /contracts/VortexLock
type: contract
---

## VortexLock

***

### Implements

- [Context](/@exoda/contracts/utils/Context)
- [IOwnable](/@exoda/contracts/interfaces/access/IOwnable)
- [IVortexLock](/contracts/interfaces/IVortexLock)
- [Ownable](/@exoda/contracts/access/Ownable)

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
constructor(uint256 startBlock, uint256 endBlock, uint256 finalizingBlock, contract IERC20Burnable token) public
```

#### loadToken

```solidity
function loadToken(uint256 amount) public
```

#### die

```solidity
function die() public
```

Runs the last task after reaching the final block.

#### addBeneficiary

```solidity
function addBeneficiary(address benefitary) public
```

Adds a benefitary as long as the startBlock is not reached.

#### claim

```solidity
function claim() public
```

#### getClaimableAmount

```solidity
function getClaimableAmount() public view returns (uint256)
```

[Back](/index)