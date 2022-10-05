---
filename: /contracts/interfaces/IMagneticFieldGenerator
type: interface
---

## IMagneticFieldGenerator

***

### Events

#### Deposit

```solidity
event Deposit(address user, uint256 pid, uint256 amount, address to)
```

#### EmergencyWithdraw

```solidity
event EmergencyWithdraw(address user, uint256 pid, uint256 amount, address to)
```

#### Harvest

```solidity
event Harvest(address user, uint256 pid, uint256 amount, address to)
```

#### LogPoolAddition

```solidity
event LogPoolAddition(uint256 pid, uint256 allocPoint, contract IERC20 lpToken)
```

#### LogSetPool

```solidity
event LogSetPool(uint256 pid, uint256 allocPoint)
```

#### LogUpdatePool

```solidity
event LogUpdatePool(uint256 pid, uint256 lastRewardBlock, uint256 lpSupply, uint256 accFermionPerShare)
```

#### Migrate

```solidity
event Migrate(uint256 pid, uint256 balance, contract IERC20 fromToken, contract IERC20 toToken)
```

#### Withdraw

```solidity
event Withdraw(address user, uint256 pid, uint256 amount, address to)
```

***

### Functions

#### add

```solidity
function add(uint256 allocPoint, contract IERC20 lpToken, uint256 lockPeriod) external
```

Add a new LP to the pool. Can only be called by the owner.
WARNING DO NOT add the same LP token more than once. Rewards will be messed up if you do.

| Name | Type | Description |
| ---- | ---- | ----------- |
| allocPoint | uint256 | AP of the new pool. |
| lpToken | contract IERC20 | Address of the LP ERC-20 token. |
| lockPeriod | uint256 | Number of Blocks the pool should disallow withdraws of all kind. |

#### deposit

```solidity
function deposit(uint256 pid, uint256 amount, address to) external
```

#### disablePool

```solidity
function disablePool(uint256 pid) external
```

#### emergencyWithdraw

```solidity
function emergencyWithdraw(uint256 pid, address to) external
```

#### handOverToSuccessor

```solidity
function handOverToSuccessor(contract IMagneticFieldGenerator successor) external
```

#### harvest

```solidity
function harvest(uint256 pid, address to) external
```

#### massUpdatePools

```solidity
function massUpdatePools() external
```

#### migrate

```solidity
function migrate(uint256 pid) external
```

#### renounceOwnership

```solidity
function renounceOwnership() external
```

#### set

```solidity
function set(uint256 pid, uint256 allocPoint) external
```

#### setFermionPerBlock

```solidity
function setFermionPerBlock(uint256 fermionPerBlock) external
```

#### setMigrator

```solidity
function setMigrator(contract IMigratorDevice migratorContract) external
```

#### setStore

```solidity
function setStore(contract IMagneticFieldGeneratorStore storeContract) external
```

#### transferOwnership

```solidity
function transferOwnership(address newOwner) external
```

#### updatePool

```solidity
function updatePool(uint256 pid) external returns (struct PoolInfo)
```

#### withdraw

```solidity
function withdraw(uint256 pid, uint256 amount, address to) external
```

#### withdrawAndHarvest

```solidity
function withdrawAndHarvest(uint256 pid, uint256 amount, address to) external
```

#### getFermionContract

```solidity
function getFermionContract() external view returns (contract IFermion)
```

#### getFermionPerBlock

```solidity
function getFermionPerBlock() external view returns (uint256)
```

#### getStartBlock

```solidity
function getStartBlock() external view returns (uint256)
```

#### migrator

```solidity
function migrator() external view returns (contract IMigratorDevice)
```

#### owner

```solidity
function owner() external view returns (address)
```

#### pendingFermion

```solidity
function pendingFermion(uint256 pid, address user) external view returns (uint256)
```

#### poolInfo

```solidity
function poolInfo(uint256 pid) external view returns (struct PoolInfo)
```

#### poolLength

```solidity
function poolLength() external view returns (uint256)
```

#### successor

```solidity
function successor() external view returns (contract IMagneticFieldGenerator)
```

#### totalAllocPoint

```solidity
function totalAllocPoint() external view returns (uint256)
```

#### userInfo

```solidity
function userInfo(uint256 pid, address user) external view returns (struct UserInfo)
```

[Back](/index)