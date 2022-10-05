---
filename: /contracts/MagneticFieldGeneratorStore
type: contract
---

## MagneticFieldGeneratorStore

***

### Implements

- [Context](/@exoda/contracts/utils/Context)
- [IMagneticFieldGeneratorStore](/contracts/interfaces/IMagneticFieldGeneratorStore)
- [IOwnable](/@exoda/contracts/interfaces/access/IOwnable)
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

#### newPoolInfo

```solidity
function newPoolInfo(struct PoolInfo pi) external
```

#### deletePoolInfo

```solidity
function deletePoolInfo(uint256 pid) external
```

#### updateUserInfo

```solidity
function updateUserInfo(uint256 pid, address user, struct UserInfo ui) external
```

#### updatePoolInfo

```solidity
function updatePoolInfo(uint256 pid, struct PoolInfo pi) external
```

#### getPoolInfo

```solidity
function getPoolInfo(uint256 pid) external view returns (struct PoolInfo)
```

#### getPoolLength

```solidity
function getPoolLength() external view returns (uint256)
```

#### getUserInfo

```solidity
function getUserInfo(uint256 pid, address user) external view returns (struct UserInfo)
```

#### renounceOwnership

```solidity
function renounceOwnership() public
```

Leaves the contract without owner. Can only be called by the current owner.
This is a dangerous call be aware of the consequences

#### owner

```solidity
function owner() public view returns (address)
```

Returns the address of the current owner.

[Back](/index)