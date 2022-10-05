---
filename: /contracts/UniMigrator
type: contract
---

## UniMigrator

***

### Implements

- [IMigratorDevice](/contracts/interfaces/IMigratorDevice)

***

### Functions

#### constructor

```solidity
constructor(address beneficiaryAddress) public
```

#### migrate

```solidity
function migrate(contract IERC20 src) public returns (address)
```

#### beneficiary

```solidity
function beneficiary() public view returns (address)
```

[Back](/index)