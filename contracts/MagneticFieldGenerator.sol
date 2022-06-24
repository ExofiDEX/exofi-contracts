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
	// Info of each pool.
	PoolInfo[] private _poolInfo;

	// The migrator contract. It has a lot of power. Can only be set through governance (owner).
	IMigratorDevice private _migrator;

	// Info of each user that stakes LP tokens.
	mapping(uint256 => mapping(address => UserInfo)) public userInfo;
	// Total allocation points. Must be the sum of all allocation points in all pools.
	uint256 private _totalAllocPoint; // Initializes with 0

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

	/// @notice Add a new LP to the pool. Can only be called by the owner.
	/// WARNING DO NOT add the same LP token more than once. Rewards will be messed up if you do.
	/// @param allocPoint AP of the new pool.
	/// @param lpToken Address of the LP ERC-20 token.
	function add(uint256 allocPoint, IERC20 lpToken) override public onlyOwner
	{
		// Do every time.
		// If a pool prevents massUpdatePools because of accFermionPerShare overflow disable the responsible pool with disablePool.
		massUpdatePools();
		uint256 lastRewardBlock = block.number > _startBlock ? block.number : _startBlock;
		_totalAllocPoint = _totalAllocPoint + allocPoint;
		_poolInfo.push(
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
		PoolInfo storage pool = _poolInfo[pid];
		UserInfo storage user = userInfo[pid][msg.sender];

		updatePool(pid);

		uint256 userAmount = user.amount;
		if (userAmount > 0)
		{
			// Divion of uint values can not overflow.
			// _unsafeDiv((user.amount * pool.accFermionPerShare), _ACC_FERMION_PRECISSION) can only be >= user.rewardDebt
			uint256 pending = _unsafeSub(_unsafeDiv((userAmount * pool.accFermionPerShare), _ACC_FERMION_PRECISSION), user.rewardDebt);

			// THOUGHTS on _safeFermionTransfer(msg.sender, pending);
			// The intend was that if there is a rounding error and MFG does therefore not hold enouth Fermion,
			// the available amount of Fermion will be used.
			// However since all variables are uint rounding errors can only appear in the form of cut of decimals.
			// It is therefore impossible at any given time that the MFG contracts have not enouth Fermions.
			// What will happen is that through the constant cut of deciamls a small part the amount of Fermions
			// hold by the MFG can not be claimed by the pools because that amount was lost during the calculation.
			// TODO: This can be addressed by a later version if necesarry. One option would be to burn the non claimable amount at a regular basis.
			_fermion.transfer(msg.sender, pending);
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
		// Underflow is impossible since _totalAllocPoint can not be lower that _poolInfo[pid].allocPoint.
		_totalAllocPoint = _unsafeSub(_totalAllocPoint, _poolInfo[pid].allocPoint);
		_poolInfo[pid].allocPoint = 0;
	}

	// Withdraw without caring about rewards. EMERGENCY ONLY.
	function emergencyWithdraw(uint256 pid) public override
	{
		PoolInfo storage pool = _poolInfo[pid];
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
			uint256 length = _poolInfo.length;
			for (uint256 pid = 0; pid < length; ++pid)
			{
				updatePool(pid);
			}
		}
	}

	// Migrate lp token to another lp contract. Can be called by anyone. We trust that migrator contract is good.
	function migrate(uint256 pid) override public onlyOwner
	{
		require(address(_migrator) != address(0), "migrate: no migrator");
		PoolInfo storage pool = _poolInfo[pid];
		IERC20 lpToken = pool.lpToken;
		uint256 bal = lpToken.balanceOf(address(this));
		lpToken.safeApprove(address(_migrator), bal);
		IERC20 newLpToken = IERC20(_migrator.migrate(lpToken));
		require(bal == newLpToken.balanceOf(address(this)), "migrate: bad");
		pool.lpToken = newLpToken;
	}

	/// @notice Leaves the contract without owner. Can only be called by the current owner.
	function renounceOwnership() public override(Ownable, IMagneticFieldGenerator)
	{
		Ownable.renounceOwnership();
	}

	// Update the given pool's FMN allocation point. Can only be called by the owner.
	function set(uint256 pid, uint256 allocPoint) override public onlyOwner
	{
		// Do every time.
		// If a pool prevents massUpdatePools because of accFermionPerShare overflow disable the responsible pool with disablePool.
		massUpdatePools();
		// Underflow is impossible since _totalAllocPoint can not be lower that _poolInfo[pid].allocPoint.
		_totalAllocPoint = _unsafeSub(_totalAllocPoint, _poolInfo[pid].allocPoint) + allocPoint;
		_poolInfo[pid].allocPoint = allocPoint;
	}

	// Set the migrator contract. Can only be called by the owner.
	function setMigrator(IMigratorDevice migratorContract) override public onlyOwner
	{
		_migrator = migratorContract;
	}

	// Update dev address by the previous dev.
	function transferDevelopment(address newDeveloper) override public onlyDeveloper
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
		PoolInfo storage pool = _poolInfo[pid];

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
		_fermion.mint(_developer, _unsafeDiv(fermionReward, 10));
		_fermion.mint(address(this), fermionReward);
		pool.lastRewardBlock = block.number;
	}

	// Withdraw LP tokens from MagneticFieldGenerator.
	function withdraw(uint256 pid, uint256 amount) public override
	{
		//HINT: pool.accFermionPerShare can only grow till it overflows, at that point every withdraw will fail.
		//HINT: The owner can set pool allocPoint to 0 without pool reward update. After that all lp tokens can be withdrawn
		//HINT: including the rewards up to the the last sucessful pool reward update.

		PoolInfo storage pool = _poolInfo[pid];
		UserInfo storage user = userInfo[pid][msg.sender];
		
		uint256 userAmount = user.amount;
		require(userAmount >= amount, "MFG: amount exeeds stored amount");
		
		updatePool(pid);

		uint256 accFermionPerShare = pool.accFermionPerShare;
		// user.rewardDept can not be greater than _unsafeDiv((userAmount * pool.accFermionPerShare), _ACC_FERMION_PRECISSION)
		// Division of uint can not overflow.
		uint256 pending = _unsafeSub(_unsafeDiv((userAmount * accFermionPerShare), _ACC_FERMION_PRECISSION), user.rewardDebt);
		// THOUGHTS on _safeFermionTransfer(msg.sender, pending);
		// The intend was that if there is a rounding error and MFG does therefore not hold enouth Fermion,
		// the available amount of Fermion will be used.
		// However since all variables are uint rounding errors can only appear in the form of cut of decimals.
		// It is therefore impossible at any given time that the MFG contracts have not enouth Fermions.
		// What will happen is that through the constant cut of deciamls a small part the amount of Fermions
		// hold by the MFG can not be claimed by the pools because that amount was lost during the calculation.
		// TODO: This can be addressed by a later version if necesarry. One option would be to burn the non claimable amount at a regular basis.
		_fermion.transfer(msg.sender, pending);

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

	/// @notice Returns the current migrator.
	function migrator() override public view returns(IMigratorDevice)
	{
		return _migrator;
	}

	/// @notice Returns the address of the current owner.
	function owner() public view override(Ownable, IMagneticFieldGenerator) returns (address)
	{
		return Ownable.owner();
	}

	// View function to see pending FMNs on frontend.
	function pendingFermion(uint256 pid, address user) public view override returns (uint256)
	{
		PoolInfo storage pool = _poolInfo[pid];
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

	function poolInfo(uint256 pid) override public view returns (PoolInfo memory)
	{
		return _poolInfo[pid];
	}

	function poolLength() override public view returns (uint256)
	{
		return _poolInfo.length;
	}

	function totalAllocPoint() override public view returns (uint256)
	{
		return _totalAllocPoint;
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
		return _unsafeDiv(multiplier * _unsafeMul(_fermionPerBlock, allocPoint), _totalAllocPoint);
	}

	function _getAccFermionPerShare(uint256 currentAccFermionShare, uint256 fermionReward, uint256 lpSupply) private pure returns (uint256)
	{
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
