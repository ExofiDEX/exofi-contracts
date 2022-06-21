// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev Interface of the Fermion token.
 */
interface IFermion
{
	/**
	* @dev Mints `amount` tokens to `account`.
	*
	* Emits a {Transfer} event with `from` set to the zero address.
	*/
	function mint(address to, uint256 amount) external;

	// -------------------- IERC20AltApprove --------------------
	/**
	* @notice Atomically decreases the allowance granted to `spender` by the caller.
	*
	* This is an alternative to {approve} that can be used as a mitigation for
	* problems described in {IERC20-approve}.
	*
	* Emits an {Approval} event indicating the updated allowance.
	*
	* Requirements:
	*
	* - `spender` cannot be the zero address.
	* - `spender` must have allowance for the caller of at least
	* `subtractedValue`.
	*/
	function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool);

	/**
	* @notice Atomically increases the allowance granted to `spender` by the caller.
	*
	* This is an alternative to {approve} that can be used as a mitigation for
	* problems described in {IERC20-approve}.
	*
	* Emits an {Approval} event indicating the updated allowance.
	*
	* Requirements:
	*
	* - `spender` cannot be the zero address.
	*/
	function increaseAllowance(address spender, uint256 addedValue) external returns (bool);
	// -------------------- IERC20Burnable --------------------
	/**
	* @notice Destroys {amount} tokens from the caller.
	*
	* Emits an {Transfer} event.
	*
	* @param amount The {amount} of tokens that should be destroyed.
	*/
	function burn(uint256 amount) external;

	/**
	* @notice Destroys {amount} tokens from {account}, deducting from the caller's allowance.
	*
	* Emits an {Approval} and an {Transfer} event.
	*
	* @param account The {account} where the tokens should be destroyed.
	* @param amount The {amount} of tokens that should be destroyed.
	*/
	function burnFrom(address account, uint256 amount) external;
	// -------------------- IERC20Metadata --------------------
	/// @notice Returns the name of the token.
	/// @return The token name.
	function name() external view returns (string memory);

	/// @notice Returns the symbol of the token.
	/// @return The symbol for the token.
	function symbol() external view returns (string memory);

	/// @notice Returns the decimals of the token.
	/// @return The decimals for the token.
	function decimals() external pure returns (uint8);
	// -------------------- IOwnable --------------------
	function renounceOwnership() external;
	function transferOwnership(address newOwner) external;
	function owner() external view returns (address);

	// -------------------- IERC20 --------------------
	/**
	* @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
	*
	* Returns a boolean value indicating whether the operation succeeded.
	*
	* IMPORTANT: Beware that changing an allowance with this method brings the risk
	* that someone may use both the old and the new allowance by unfortunate
	* transaction ordering. One possible solution to mitigate this race
	* condition is to first reduce the spender's allowance to 0 and set the
	* desired value afterwards:
	* https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
	*
	* Emits an {Approval} event.
	*/
	function approve(address spender, uint256 amount) external returns (bool);

	/**
	* @dev Moves `amount` tokens from the caller's account to `to`.
	*
	* Returns a boolean value indicating whether the operation succeeded.
	*
	* Emits a {Transfer} event.
	*/
	function transfer(address to, uint256 amount) external returns (bool);

	/**
	* @dev Moves `amount` tokens from `from` to `to` using the allowance mechanism.
	* `amount` is then deducted from the caller's allowance.
	*
	* Returns a boolean value indicating whether the operation succeeded.
	*
	* Emits a {Transfer} event.
	*/
	function transferFrom(address from, address to, uint256 amount) external returns (bool);

	/**
	* @dev Returns the remaining number of tokens that `spender` will be allowed to spend on behalf of `owner` through {transferFrom}.
	* This is zero by default.
	*
	* This value changes when {approve}, {increaseAllowance}, {decreseAllowance} or {transferFrom} are called.
	*/
	function allowance(address owner, address spender) external view returns (uint256);

	/**
	* @dev Returns the amount of tokens owned by `account`.
	*/
	function balanceOf(address account) external view returns (uint256);

	/**
	* @dev Returns the amount of tokens in existence.
	*/
	function totalSupply() external view returns (uint256);
}