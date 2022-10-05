---
filename: /contracts/interfaces/IMagneticFieldGeneratorStore
type: interface
---

## IMagneticFieldGeneratorStore

***

### Implements

- [IOwnable](/@exoda/contracts/interfaces/access/IOwnable)

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

#### deletePoolInfo

```solidity
function deletePoolInfo(uint256 pid) external
```

#### newPoolInfo

```solidity
function newPoolInfo(struct PoolInfo pi) external
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

[Back](/index)