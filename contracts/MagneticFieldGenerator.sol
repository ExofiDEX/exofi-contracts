// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@exoda/contracts/access/Ownable.sol";
import "@exoda/contracts/interfaces/token/ERC20/IERC20.sol";
import "@exoda/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IMagneticFieldGenerator.sol";

// MagneticFieldGenerator is the master of Fermion. He can make Fermion and he is a fair machine.
contract MagneticFieldGenerator is IMagneticFieldGenerator, Ownable
{
	using SafeERC20 for IERC20;
	
	// Info of each user.
	struct UserInfo
	{
		uint256 amount; // How many LP tokens the user has provided.
		uint256 rewardDebt; // Reward debt. See explanation below.
		//
		// We do some fancy math here. Basically, any point in time, the amount of FMNs
		// entitled to a user but is pending to be distributed is:
		//
		//   pending reward = (user.amount * pool.accFermionPerShare) - user.rewardDebt
		//
		// Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
		//   1. The pool's `accFermionPerShare` (and `lastRewardBlock`) gets updated.
		//   2. User receives the pending reward sent to his/her address.
		//   3. User's `amount` gets updated.
		//   4. User's `rewardDebt` gets updated.
	}

	// Info of each pool.
	struct PoolInfo
	{
		IERC20 lpToken; // Address of LP token contract.
		uint256 allocPoint; // How many allocation points assigned to this pool. FMNs to distribute per block.
		uint256 lastRewardBlock; // Last block number that FMNs distribution occurs.
		uint256 accFermionPerShare; // Accumulated FMNs per share, times _ACC_FERMION_PRECISSION. See below.
	}

	// Dev address.
	address private _developer;
	// FMN tokens created per block.
	uint256 private _fermionPerBlock;

	// The FMN TOKEN!
	IFermion private immutable _fermion;
	// The block number when FMN mining starts.
	uint256 private immutable _startBlock;
	// Accumulated Fermion Precision
	uint256 private constant _ACC_FERMION_PRECISSION = 1e12;

	// The migrator contract. It has a lot of power. Can only be set through governance (owner).
	IMigratorDevice public migrator;
	// Info of each pool.
	PoolInfo[] public poolInfo;
	// Info of each user that stakes LP tokens.
	mapping(uint256 => mapping(address => UserInfo)) public userInfo;
	// Total allocation points. Must be the sum of all allocation points in all pools.
	uint256 public totalAllocPoint = 0;

	/**
     * @dev Throws if called by any account other than the developer.
     */
    modifier onlyDeveloper()
	{
        require(developer() == _msgSender(), "MFG: caller is not developer");
        _;
    }

	constructor(IFermion fermion, address initialDeveloper, uint256 fermionPerBlock, uint256 startBlock)
	{
		_fermion = fermion;
		_developer = initialDeveloper;
		_fermionPerBlock = fermionPerBlock;
		_startBlock = startBlock;
	}

	// Add a new lp to the pool. Can only be called by the owner.
	// WARNING DO NOT add the same LP token more than once. Rewards will be messed up if you do.
	function add(uint256 allocPoint, IERC20 lpToken) public override onlyOwner
	{
		// Do every time.
		// If a pool prevents massUpdatePools because of accFermionPerShare overflow disable the responsible pool with disablePool.
		massUpdatePools();
		uint256 lastRewardBlock = block.number > _startBlock ? block.number : _startBlock;
		totalAllocPoint = totalAllocPoint + allocPoint;
		poolInfo.push(
			PoolInfo({
				lpToken: lpToken,
				allocPoint: allocPoint,
				lastRewardBlock: lastRewardBlock,
				accFermionPerShare: 0
			})
		);
	}

	// Deposit LP tokens to MagneticFieldGenerator for FMN allocation.
	function deposit(uint256 pid, uint256 amount) public override
	{
		PoolInfo storage pool = poolInfo[pid];
		UserInfo storage user = userInfo[pid][msg.sender];

		updatePool(pid);

		uint256 userAmount = user.amount;
		if (userAmount > 0)
		{
			// Divion of uint values can not overflow.
			// _unsafeDiv((user.amount * pool.accFermionPerShare), _ACC_FERMION_PRECISSION) can only be >= user.rewardDebt
			uint256 pending = _unsafeSub(_unsafeDiv((userAmount * pool.accFermionPerShare), _ACC_FERMION_PRECISSION), user.rewardDebt);
			_safeFermionTransfer(msg.sender, pending);
		}

		pool.lpToken.safeTransferFrom(address(msg.sender), address(this), amount);
		
		userAmount = userAmount + amount;
		user.amount = userAmount;
		// This are the rewards the user would have till now since the pool creation.
		// This is a cheap way to get the reward for the user starting at a given time.
		user.rewardDebt = ((userAmount * pool.accFermionPerShare) / _ACC_FERMION_PRECISSION);
		emit Deposit(msg.sender, pid, amount);
	}

	// Update the given pool's FMN allocation point to 0. Can only be called by the owner.
	// This is necessary if a pool reaches a accFermionPerShare overflow.
	function disablePool(uint256 pid) public override onlyOwner
	{
		// Underflow is impossible since totalAllocPoint can not be lower that poolInfo[pid].allocPoint.
		totalAllocPoint = _unsafeSub(totalAllocPoint, poolInfo[pid].allocPoint);
		poolInfo[pid].allocPoint = 0;
	}

	// Withdraw without caring about rewards. EMERGENCY ONLY.
	function emergencyWithdraw(uint256 pid) public override
	{
		PoolInfo storage pool = poolInfo[pid];
		UserInfo storage user = userInfo[pid][msg.sender];

		uint256 userAmount = user.amount;
		pool.lpToken.safeTransfer(address(msg.sender), userAmount);
		emit EmergencyWithdraw(msg.sender, pid, userAmount);
		user.amount = 0;
		user.rewardDebt = 0;
	}

	// Update reward vairables for all pools. Be careful of gas spending!
	function massUpdatePools() public override
	{
		// Overflow of pid not possible and need not to be checked.
		unchecked
		{
			uint256 length = poolInfo.length;
			for (uint256 pid = 0; pid < length; ++pid)
			{
				updatePool(pid);
			}
		}
	}

	// Migrate lp token to another lp contract. Can be called by anyone. We trust that migrator contract is good.
	function migrate(uint256 pid) override public
	{
		require(address(migrator) != address(0), "migrate: no migrator");
		PoolInfo storage pool = poolInfo[pid];
		IERC20 lpToken = pool.lpToken;
		uint256 bal = lpToken.balanceOf(address(this));
		lpToken.safeApprove(address(migrator), bal);
		IERC20 newLpToken = migrator.migrate(lpToken);
		require(bal == newLpToken.balanceOf(address(this)), "migrate: bad");
		pool.lpToken = newLpToken;
	}

	/// @notice Leaves the contract without owner. Can only be called by the current owner.
	function renounceOwnership() public override(Ownable, IMagneticFieldGenerator)
	{
		Ownable.renounceOwnership();
	}

	// Update the given pool's FMN allocation point. Can only be called by the owner.
	function set(uint256 pid, uint256 allocPoint) public override onlyOwner
	{
		// Do every time.
		// If a pool prevents massUpdatePools because of accFermionPerShare overflow disable the responsible pool with disablePool.
		massUpdatePools();
		// Underflow is impossible since totalAllocPoint can not be lower that poolInfo[pid].allocPoint.
		totalAllocPoint = _unsafeSub(totalAllocPoint, poolInfo[pid].allocPoint) + allocPoint;
		poolInfo[pid].allocPoint = allocPoint;
	}

	// Set the migrator contract. Can only be called by the owner.
	function setMigrator(IMigratorDevice migratorContract) override public onlyOwner
	{
		migrator = migratorContract;
	}

	// Update dev address by the previous dev.
	function transferDevelopment(address newDeveloper) public override onlyDeveloper
	{
		require(newDeveloper != address(0), "MFG: new developer is address(0)");
		_transferDevelopment(newDeveloper);
	}

	/// @notice Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
	function transferOwnership(address newOwner) public override(Ownable, IMagneticFieldGenerator)
	{
		Ownable.transferOwnership(newOwner);
	}

	// Update reward variables of the given pool to be up-to-date.
	function updatePool(uint256 pid) public override
	{
		PoolInfo storage pool = poolInfo[pid];

		if (block.number <= pool.lastRewardBlock)
		{
			return;
		}

		uint256 lpSupply = pool.lpToken.balanceOf(address(this));

		if (lpSupply == 0)
		{
			pool.lastRewardBlock = block.number;
			return;
		}

		uint256 fermionReward = _getFermionReward(_getMultiplier(pool.lastRewardBlock, block.number), pool.allocPoint);
		pool.accFermionPerShare = _getAccFermionPerShare(pool.accFermionPerShare, fermionReward, lpSupply);
		_fermion.mint(_developer, _unsafeDiv(fermionReward, 10)); //TODO: Developer gets Fermion?
		_fermion.mint(address(this), fermionReward);
		pool.lastRewardBlock = block.number;
	}

	// Withdraw LP tokens from MagneticFieldGenerator.
	function withdraw(uint256 pid, uint256 amount) public override
	{
		//HINT: pool.accFermionPerShare can only grow till it overflows, at that point every withdraw will fail.
		//HINT: The owner can set pool allocPoint to 0 without pool reward update. After all lp tokens can be withdrawn
		//HINT: includen the rewards up to the the last sucessful pool reward update.

		PoolInfo storage pool = poolInfo[pid];
		UserInfo storage user = userInfo[pid][msg.sender];
		
		uint256 userAmount = user.amount;
		require(userAmount >= amount, "MFG: amount exeeds stored amount");
		
		updatePool(pid);

		uint256 accFermionPerShare = pool.accFermionPerShare;
		// user.rewardDept can not be greater than _unsafeDiv((userAmount * pool.accFermionPerShare), _ACC_FERMION_PRECISSION)
		// Division of uint can not overflow.
		uint256 pending = _unsafeSub(_unsafeDiv((userAmount * accFermionPerShare), _ACC_FERMION_PRECISSION), user.rewardDebt);
		_safeFermionTransfer(msg.sender, pending);

		// Can not overflow. Checked with require.
		userAmount = _unsafeSub(userAmount, amount);
		user.amount = userAmount;
		// Division of uint can not overflow.
		user.rewardDebt = _unsafeDiv(userAmount * accFermionPerShare, _ACC_FERMION_PRECISSION);
		pool.lpToken.safeTransfer(address(msg.sender), amount);
		emit Withdraw(msg.sender, pid, amount);
	}

	function developer() public override view returns (address)
	{
		return _developer;
	}

	function getFermionContract() public override view returns (IFermion)
	{
		return _fermion;
	}

	function getFermionPerBlock() public override view returns (uint256)
	{
		return _fermionPerBlock;
	}

	function getStartBlock() public override view returns (uint256)
	{
		return _startBlock;
	}

	/// @notice Returns the address of the current owner.
	function owner() public view override(Ownable, IMagneticFieldGenerator) returns (address)
	{
		return Ownable.owner();
	}

	// View function to see pending FMNs on frontend.
	function pendingFermion(uint256 pid, address user) public view override returns (uint256)
	{
		PoolInfo storage pool = poolInfo[pid];
		UserInfo storage singleUserInfo = userInfo[pid][user];
		uint256 accFermionPerShare = pool.accFermionPerShare;
		uint256 lpSupply = pool.lpToken.balanceOf(address(this));
		if (block.number > pool.lastRewardBlock && lpSupply != 0)
		{
			accFermionPerShare = _getAccFermionPerShare(
				accFermionPerShare,
				_getFermionReward(_getMultiplier(pool.lastRewardBlock, block.number), pool.allocPoint)
				, lpSupply);
		}
		return _unsafeDiv((singleUserInfo.amount * accFermionPerShare), _ACC_FERMION_PRECISSION) - singleUserInfo.rewardDebt;
	}

	function poolLength() public override  view returns (uint256)
	{
		return poolInfo.length;
	}

	// Safe Fermion transfer function, just in case if rounding error causes pool to not have enough FMNs.
	function _safeFermionTransfer(address to, uint256 amount) private
	{
		uint256 fermionBal = _fermion.balanceOf(address(this));
		if (amount > fermionBal)
		{
			_fermion.transfer(to, fermionBal);
		}
		else
		{
			_fermion.transfer(to, amount);
		}
	}

	/**
	* @dev Transfers development of the contract to a new account (`newDeveloper`).
	* Internal function without access restriction.
	*/
	function _transferDevelopment(address newDeveloper) private
	{
		address oldDeveloper = _developer;
		_developer = newDeveloper;
		emit DevelopmentTransferred(oldDeveloper, newDeveloper);
	}

	function _getFermionReward(uint256 multiplier, uint256 allocPoint) private view returns (uint256)
	{
		// As long as the owner chooses sane values for _fermionPerBlock and pool.allocPoint it is unlikely that an overflow ever happens
		// Since _fermionPerBlock and pool.allocPoint are choosen by  the owner, it is the responsibility of the owner to ensure
		// that there is now overflow in multiplying these to values.
		// Divions can not generate an overflow if used with uint values. Div by 0 will always panic, wrapped or not.
		// The only place an overflow can happen (even very unlikeley) is if the multiplier gets big enouth to force an overflow.
		return _unsafeDiv(multiplier * _unsafeMul(_fermionPerBlock, allocPoint), totalAllocPoint);
	}

	function _getAccFermionPerShare(uint256 currentAccFermionShare, uint256 fermionReward, uint256 lpSupply) private pure returns (uint256)
	{
		//TODO: Evaluate why fermion Reward is multplied with _ACC_FERMION_PRECISSION
		// Divions can not generate an overflow if used with uint values. Div by 0 will always panic, wrapped or not.

		// Check for overflow for automatic pool deactivation.
		return currentAccFermionShare + _unsafeDiv(fermionReward * _ACC_FERMION_PRECISSION, lpSupply); 
	}

	// Return reward multiplier over the given _from to _to block.
	function _getMultiplier(uint256 from, uint256 to) private pure returns (uint256)
	{
		unchecked
		{
			return to - from;
		}
	}

	function _unsafeAdd(uint256 a, uint256 b) private pure returns (uint256)
	{
		unchecked
		{
			return a + b;
		}
	}

	function _unsafeDiv(uint256 a, uint256 b) private pure returns (uint256)
	{
		unchecked
		{
			return a / b;
		}
	}

	function _unsafeMul(uint256 a, uint256 b) private pure returns (uint256)
	{
		unchecked
		{
			return a * b;
		}
	}

	function _unsafeSub(uint256 a, uint256 b) private pure returns (uint256)
	{
		unchecked
		{
			return a - b;
		}
	}
}
