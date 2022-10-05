---
filename: /contracts/MagneticFieldGenerator
type: contract
---

## MagneticFieldGenerator

***

### Implements

- [Context](/@exoda/contracts/utils/Context)
- [IMagneticFieldGenerator](/contracts/interfaces/IMagneticFieldGenerator)
- [IOwnable](/@exoda/contracts/interfaces/access/IOwnable)
- [Ownable](/@exoda/contracts/access/Ownable)

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

#### OwnershipTransferred

```solidity
event OwnershipTransferred(address previousOwner, address newOwner)
```

Emitted when ownership is moved from one address to another.

| Name | Type | Indexed | Description |
| ---- | ---- | ------- | ----------- |
| previousOwner | address | true | (indexed) The owner of the contract until now. |
| newOwner | address | true | (indexed) The new owner of the contract. |

#### Withdraw

```solidity
event Withdraw(address user, uint256 pid, uint256 amount, address to)
```

***

### Functions

#### constructor

```solidity
constructor(contract IFermion fermion, contract IPlanet planet, uint256 fermionPerBlock, uint256 startBlock) public
```

#### setStore

```solidity
function setStore(contract IMagneticFieldGeneratorStore storeContract) external
```

#### add

```solidity
function add(uint256 allocPoint, contract IERC20 lpToken, uint256 lockPeriod) public
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
function deposit(uint256 pid, uint256 amount, address to) public
```

#### disablePool

```solidity
function disablePool(uint256 pid) public
```

#### emergencyWithdraw

```solidity
function emergencyWithdraw(uint256 pid, address to) public
```

#### handOverToSuccessor

```solidity
function handOverToSuccessor(contract IMagneticFieldGenerator suc) public
```

#### massUpdatePools

```solidity
function massUpdatePools() public
```

#### migrate

```solidity
function migrate(uint256 pid) public
```

#### renounceOwnership

```solidity
function renounceOwnership() public
```

Leaves the contract without owner. Can only be called by the current owner.

#### set

```solidity
function set(uint256 pid, uint256 allocPoint) public
```

#### setFermionPerBlock

```solidity
function setFermionPerBlock(uint256 fermionPerBlock) public
```

#### setMigrator

```solidity
function setMigrator(contract IMigratorDevice migratorContract) public
```

#### transferOwnership

```solidity
function transferOwnership(address newOwner) public
```

Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.

#### updatePool

```solidity
function updatePool(uint256 pid) public returns (struct PoolInfo)
```

#### harvest

```solidity
function harvest(uint256 pid, address to) public
```

#### withdraw

```solidity
function withdraw(uint256 pid, uint256 amount, address to) public
```

#### withdrawAndHarvest

```solidity
function withdrawAndHarvest(uint256 pid, uint256 amount, address to) public
```

#### getFermionContract

```solidity
function getFermionContract() public view returns (contract IFermion)
```

#### getFermionPerBlock

```solidity
function getFermionPerBlock() public view returns (uint256)
```

#### getStartBlock

```solidity
function getStartBlock() public view returns (uint256)
```

#### migrator

```solidity
function migrator() public view returns (contract IMigratorDevice)
```

Returns the current migrator.

#### owner

```solidity
function owner() public view returns (address)
```

Returns the address of the current owner.

#### pendingFermion

```solidity
function pendingFermion(uint256 pid, address user) public view returns (uint256)
```

#### poolInfo

```solidity
function poolInfo(uint256 pid) public view returns (struct PoolInfo)
```

#### poolLength

```solidity
function poolLength() public view returns (uint256)
```

#### successor

```solidity
function successor() public view returns (contract IMagneticFieldGenerator)
```

Returns the address of the sucessor.

#### totalAllocPoint

```solidity
function totalAllocPoint() public view returns (uint256)
```

#### userInfo

```solidity
function userInfo(uint256 pid, address user) public view returns (struct UserInfo)
```

[Back](/index)