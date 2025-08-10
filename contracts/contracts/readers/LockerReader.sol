// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ERC20 Locker Reader View Interface
/// @author tokenly.tools
/// @notice Minimal interface for reading public state from ERC20Locker
interface IERC20LockerReaderView {
    /// @notice Total number of locks ever created (including deleted)
    /// @return count The total locks count
    function totalLocks() external view returns (uint256);

    /// @notice Returns lock data for a given lock id
    /// @param lockId The lock identifier
    /// @return owner The current owner of the lock (zero if renounced)
    /// @return token The ERC20 token address
    /// @return amount The locked amount (zero if withdrawn)
    /// @return endTime The unlock timestamp
    function locks(
        uint256 lockId
    )
        external
        view
        returns (address owner, address token, uint256 amount, uint256 endTime);
}

/// @title Minimal ERC20 metadata interface
/// @author tokenly.tools
/// @notice Minimal ERC20 metadata getters used by reader
interface IERC20MetadataMinimal {
    /// @notice ERC20 token name
    /// @return The token name
    function name() external view returns (string memory);

    /// @notice ERC20 token symbol
    /// @return The token symbol
    function symbol() external view returns (string memory);

    /// @notice ERC20 token decimals
    /// @return The decimals value
    function decimals() external view returns (uint8);
}

/// @title LockerReader
/// @author https://tokenly.tools
/// @notice Read-only helper to fetch lock data from ERC20Locker with token metadata
contract LockerReader {
    struct LockView {
        uint256 lockId;
        address owner;
        address token;
        uint256 amount;
        uint256 endTime;
        string tokenName;
        string tokenSymbol;
        uint8 tokenDecimals;
    }

    /// @notice ERC20Locker contract interface this reader is bound to
    IERC20LockerReaderView public immutable LOCKER;

    error LockNotFound(uint256 lockId);
    error InvalidRange(uint256 start, uint256 endExclusive);

    /// @notice Creates a new reader bound to a specific locker
    /// @param locker_ Address of the ERC20Locker contract
    constructor(address locker_) {
        LOCKER = IERC20LockerReaderView(locker_);
    }

    /// @notice Read a single lock using the bound locker address
    /// @param lockId The lock identifier
    /// @return viewData Full view of the lock with token metadata
    function getLock(
        uint256 lockId
    ) external view returns (LockView memory viewData) {
        (bool exists, LockView memory data) = _readLock(lockId);
        if (!exists) revert LockNotFound(lockId);
        return data;
    }

    /// @notice Read all existing (non-deleted) locks using the bound locker address
    /// @return locksData Array of lock views
    function getAllLocks() external view returns (LockView[] memory locksData) {
        uint256 total = LOCKER.totalLocks();

        uint256 activeCount = 0;
        for (uint256 i = 0; i < total; ++i) {
            (, , uint256 amount, ) = LOCKER.locks(i);
            if (amount != 0) {
                unchecked {
                    ++activeCount;
                }
            }
        }

        locksData = new LockView[](activeCount);
        uint256 idx = 0;
        for (uint256 i = 0; i < total; ++i) {
            (bool exists, LockView memory data) = _readLock(i);
            if (exists) {
                locksData[idx] = data;
                unchecked {
                    ++idx;
                }
            }
        }
    }

    /// @notice Read locks within an id range [start, end) using the bound locker address
    /// @param start Inclusive start lock id
    /// @param endExclusive Exclusive end lock id
    /// @return locksData Array of lock views found in the range
    function getLocksInRange(
        uint256 start,
        uint256 endExclusive
    ) external view returns (LockView[] memory locksData) {
        uint256 total = LOCKER.totalLocks();

        if (start > endExclusive || endExclusive > total) {
            revert InvalidRange(start, endExclusive);
        }

        uint256 activeCount = 0;
        for (uint256 i = start; i < endExclusive; ++i) {
            (, , uint256 amount, ) = LOCKER.locks(i);
            if (amount != 0) {
                unchecked {
                    ++activeCount;
                }
            }
        }

        locksData = new LockView[](activeCount);
        uint256 idx = 0;
        for (uint256 i = start; i < endExclusive; ++i) {
            (bool exists, LockView memory data) = _readLock(i);
            if (exists) {
                locksData[idx] = data;
                unchecked {
                    ++idx;
                }
            }
        }
    }

    /// @notice Internal helper to load a single lock and enrich with token metadata
    /// @param lockId The lock identifier
    /// @return exists True if the lock is active (amount > 0)
    /// @return data The assembled lock view
    function _readLock(
        uint256 lockId
    ) private view returns (bool exists, LockView memory data) {
        (address owner, address token, uint256 amount, uint256 endTime) = LOCKER
            .locks(lockId);

        if (amount == 0) {
            return (false, data);
        }

        (
            string memory name_,
            string memory symbol_,
            uint8 decimals_
        ) = _readTokenMetadata(token);

        data = LockView({
            lockId: lockId,
            owner: owner,
            token: token,
            amount: amount,
            endTime: endTime,
            tokenName: name_,
            tokenSymbol: symbol_,
            tokenDecimals: decimals_
        });

        return (true, data);
    }

    /// @notice Safely reads ERC20 metadata, tolerating reverts
    /// @param token ERC20 token address
    /// @return name_ Token name (empty if unavailable)
    /// @return symbol_ Token symbol (empty if unavailable)
    /// @return decimals_ Token decimals (18 if unavailable)
    function _readTokenMetadata(
        address token
    )
        private
        view
        returns (string memory name_, string memory symbol_, uint8 decimals_)
    {
        IERC20MetadataMinimal t = IERC20MetadataMinimal(token);

        // Defaults when metadata calls revert
        name_ = "";
        symbol_ = "";
        decimals_ = 18;

        try t.name() returns (string memory n) {
            name_ = n;
        } catch {}

        try t.symbol() returns (string memory s) {
            symbol_ = s;
        } catch {}

        try t.decimals() returns (uint8 d) {
            decimals_ = d;
        } catch {}
    }
}
