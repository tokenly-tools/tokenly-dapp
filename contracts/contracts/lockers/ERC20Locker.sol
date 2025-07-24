// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ERC20Locker
 * @author https://tokenly.tools
 * @notice A contract for time-locking ERC20 tokens.
 * @dev This contract allows users to lock a specified amount of an ERC20 token for a designated recipient.
 * The tokens can only be withdrawn after the lock's end time has passed.
 */
contract ERC20Locker is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Lock {
        address owner;
        address token;
        uint256 amount;
        uint256 endTime;
    }

    /// @notice The total number of locks created.
    uint256 public totalLocks;
    /// @notice Mapping from lock ID to lock details.
    mapping(uint256 => Lock) public locks;

    /**
     * @notice Emitted when tokens are locked.
     * @param lockId The unique identifier for the lock.
     * @param owner The address that owns the lock.
     * @param token The address of the locked token.
     * @param amount The amount of tokens locked.
     * @param endTime The timestamp when tokens can be withdrawn.
     */
    event Locked(
        uint256 indexed lockId,
        address indexed owner,
        address indexed token,
        uint256 amount,
        uint256 endTime
    );
    /**
     * @notice Emitted when tokens are withdrawn from a lock.
     * @param lockId The unique identifier for the lock.
     * @param amount The amount of tokens withdrawn.
     */
    event Withdrawn(uint256 indexed lockId, uint256 indexed amount);
    /**
     * @notice Emitted when lock ownership is transferred.
     * @param lockId The unique identifier for the lock.
     * @param newOwner The address of the new owner.
     */
    event LockOwnershipTransferred(
        uint256 indexed lockId,
        address indexed newOwner
    );
    /**
     * @notice Emitted when a lock's end time is extended.
     * @param lockId The unique identifier for the lock.
     * @param newEndTime The new end time for the lock.
     */
    event LockExtended(uint256 indexed lockId, uint256 indexed newEndTime);

    error InvalidOwner();
    error InvalidTokenAddress();
    error InvalidAmount();
    error InvalidEndTime();
    error NoTokensToWithdraw();
    error NotLockOwner();
    error NotYetUnlocked();
    error MismatchedArrays();
    error InexactTransfer();

    /**
     * @notice Locks a specified amount of an ERC20 token.
     * @param owner The address that will have ownership of the lock.
     * @param token The address of the ERC20 token to lock.
     * @param amount The amount of the token to lock.
     * @param endTime The timestamp after which the tokens can be withdrawn.
     * @return lockId The ID of the newly created lock.
     */
    function lock(
        address owner,
        address token,
        uint256 amount,
        uint256 endTime
    ) external returns (uint256 lockId) {
        if (token == address(0)) revert InvalidTokenAddress();
        if (amount == 0) revert InvalidAmount();

        lockId = _createLock(owner, token, amount, endTime);

        _transferAndEnsureExactAmount(token, msg.sender, address(this), amount);
    }

    /**
     * @notice Locks a single ERC20 token for multiple recipients.
     * @param token The address of the ERC20 token to lock.
     * @param owners An array of addresses that will have ownership of the locks.
     * @param amounts An array of token amounts to lock for each owner.
     * @param endTimes An array of end times for each lock.
     */
    function lockMultiple(
        address token,
        address[] calldata owners,
        uint256[] calldata amounts,
        uint256[] calldata endTimes
    ) external {
        if (
            owners.length != amounts.length || owners.length != endTimes.length
        ) {
            revert MismatchedArrays();
        }
        if (token == address(0)) revert InvalidTokenAddress();

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; ++i) {
            totalAmount += amounts[i];
        }

        if (totalAmount == 0) revert InvalidAmount();

        for (uint256 i = 0; i < owners.length; ++i) {
            _createLock(owners[i], token, amounts[i], endTimes[i]);
        }

        _transferAndEnsureExactAmount(
            token,
            msg.sender,
            address(this),
            totalAmount
        );
    }

    /**
     * @notice Withdraws the tokens from a lock.
     * @dev This function can only be called by the lock's owner after the end time has passed.
     * The lock is deleted upon successful withdrawal.
     * @param lockId The ID of the lock to withdraw from.
     */
    function withdraw(uint256 lockId) external nonReentrant {
        _withdraw(lockId, true);
    }

    /**
     * @notice Withdraws tokens from a lock without exact amount verification.
     * @dev This function can only be called by the lock's owner after the end time has passed.
     * Use this for fee-on-transfer tokens where exact amounts cannot be guaranteed.
     * The lock is deleted upon successful withdrawal.
     * @param lockId The ID of the lock to withdraw from.
     */
    function withdrawUnsafe(uint256 lockId) external nonReentrant {
        _withdraw(lockId, false);
    }

    /**
     * @notice Internal function to handle withdrawal logic.
     * @param lockId The ID of the lock to withdraw from.
     * @param useExactAmountCheck Whether to verify exact amount transfer.
     */
    function _withdraw(uint256 lockId, bool useExactAmountCheck) internal {
        Lock memory _lock = locks[lockId];

        if (msg.sender != _lock.owner) revert NotLockOwner();
        if (block.timestamp < _lock.endTime) revert NotYetUnlocked();

        uint256 amountToWithdraw = _lock.amount;
        address owner = _lock.owner;

        delete locks[lockId];

        if (useExactAmountCheck) {
            _transferFromContractAndEnsureExactAmount(
                _lock.token,
                owner,
                amountToWithdraw
            );
        } else {
            IERC20(_lock.token).safeTransfer(owner, amountToWithdraw);
        }

        emit Withdrawn(lockId, amountToWithdraw);
    }

    /**
     * @notice Extends the end time of a lock.
     * @param lockId The ID of the lock to extend.
     * @param newEndTime The new end time, which must be later than the current end time.
     */
    function extendLock(uint256 lockId, uint256 newEndTime) external {
        Lock memory _lock = locks[lockId];
        if (msg.sender != _lock.owner) revert NotLockOwner();
        if (newEndTime < _lock.endTime + 1) revert InvalidEndTime();

        locks[lockId].endTime = newEndTime;
        emit LockExtended(lockId, newEndTime);
    }

    /**
     * @notice Transfers the ownership of a lock to a new address.
     * @param lockId The ID of the lock to transfer.
     * @param newOwner The address of the new owner.
     */
    function transferLockOwnership(uint256 lockId, address newOwner) external {
        if (newOwner == address(0)) revert InvalidOwner();

        Lock memory _lock = locks[lockId];
        if (msg.sender != _lock.owner) revert NotLockOwner();

        locks[lockId].owner = newOwner;
        emit LockOwnershipTransferred(lockId, newOwner);
    }

    /**
     * @notice Renounces the ownership of a lock, making it permanently unmanaged.
     * @dev When ownership is renounced, the owner is set to the zero address. This is an irreversible action.
     * @param lockId The ID of the lock to renounce.
     */
    function renounceLockOwnership(uint256 lockId) external {
        Lock memory _lock = locks[lockId];
        if (msg.sender != _lock.owner) revert NotLockOwner();

        locks[lockId].owner = address(0);
        emit LockOwnershipTransferred(lockId, address(0));
    }

    /**
     * @notice Transfers tokens from sender and ensures exact amount is received.
     * @param token The ERC20 token address.
     * @param from The address to transfer from.
     * @param to The address to transfer to.
     * @param expectedAmount The expected amount to be transferred.
     */
    function _transferAndEnsureExactAmount(
        address token,
        address from,
        address to,
        uint256 expectedAmount
    ) internal {
        if (expectedAmount == 0) revert InvalidAmount();

        IERC20 tokenContract = IERC20(token);
        uint256 balanceBefore = tokenContract.balanceOf(to);
        tokenContract.safeTransferFrom(from, to, expectedAmount);
        uint256 balanceAfter = tokenContract.balanceOf(to);

        uint256 actualAmount = balanceAfter - balanceBefore;

        if (actualAmount != expectedAmount) revert InexactTransfer();
    }

    /**
     * @notice Transfers tokens from contract and ensures exact amount is sent.
     * @param token The ERC20 token address.
     * @param to The address to transfer to.
     * @param expectedAmount The expected amount to be transferred.
     */
    function _transferFromContractAndEnsureExactAmount(
        address token,
        address to,
        uint256 expectedAmount
    ) internal {
        if (expectedAmount == 0) revert InvalidAmount();

        IERC20 tokenContract = IERC20(token);
        uint256 balanceBefore = tokenContract.balanceOf(to);
        tokenContract.safeTransfer(to, expectedAmount);
        uint256 balanceAfter = tokenContract.balanceOf(to);

        uint256 actualAmount = balanceAfter - balanceBefore;

        if (actualAmount != expectedAmount) revert InexactTransfer();
    }

    /**
     * @notice Creates a new lock and stores it.
     * @param owner The address that will have ownership of the lock.
     * @param token The ERC20 token address.
     * @param amount The amount of the token to lock.
     * @param endTime The timestamp after which the tokens can be withdrawn.
     * @return lockId The ID of the newly created lock.
     */
    function _createLock(
        address owner,
        address token,
        uint256 amount,
        uint256 endTime
    ) internal returns (uint256 lockId) {
        if (owner == address(0)) revert InvalidOwner();
        if (endTime < block.timestamp + 1) revert InvalidEndTime();

        lockId = totalLocks;
        locks[lockId] = Lock({
            owner: owner,
            token: token,
            amount: amount,
            endTime: endTime
        });

        ++totalLocks;
        emit Locked(lockId, owner, token, amount, endTime);
    }
}
