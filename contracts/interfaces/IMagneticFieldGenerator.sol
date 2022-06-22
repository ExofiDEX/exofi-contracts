// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@exoda/contracts/interfaces/token/ERC20/IERC20.sol";
import "./IFermion.sol";
import "./IMigratorDevice.sol";

interface IMagneticFieldGenerator
{
	// Info of each pool.
	struct PoolInfo
	{
		IERC20 lpToken; // Address of LP token contract.
		uint256 allocPoint; // How many allocation points assigned to this pool. FMNs to distribute per block.
		uint256 lastRewardBlock; // Last block number that FMNs distribution occurs.
		uint256 accFermionPerShare; // Accumulated FMNs per share, times _ACC_FERMION_PRECISSION. See below.
	}

	event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
	event DevelopmentTransferred(address indexed previousDeveloper, address indexed newDeveloper);
	event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
	event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);

	function add(uint256 allocPoint, IERC20 lpToken) external;
	function deposit(uint256 pid, uint256 amount) external;
	function disablePool(uint256 pid) external;
	function emergencyWithdraw(uint256 pid) external;
	function massUpdatePools() external;
	function migrate(uint256 pid) external;
	function renounceOwnership() external;
	function set(uint256 pid, uint256 allocPoint) external;
	function setMigrator(IMigratorDevice migratorContract) external;
	function transferOwnership(address newOwner) external;
	function transferDevelopment(address newDevelopmentAddress) external;
	function updatePool(uint256 pid) external;
	function withdraw(uint256 pid, uint256 amount) external;

	function developer() external view returns (address);
	function getFermionContract() external view returns (IFermion);
	function getFermionPerBlock() external view returns (uint256);
	function getStartBlock() external view returns (uint256);
	function migrator() external view returns(IMigratorDevice);
	function owner() external view returns (address);
	function pendingFermion(uint256 pid, address user) external view returns (uint256);
	function poolInfo(uint256 pid) external view returns (PoolInfo memory);
	function poolLength() external view returns (uint256);
	function totalAllocPoint() external view returns (uint256);
}