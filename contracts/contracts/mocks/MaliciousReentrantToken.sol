// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IERC20Locker {
    function withdraw(uint256 lockId) external;
    function withdrawUnsafe(uint256 lockId) external;
}

/**
 * @title MaliciousReentrantToken
 * @notice A malicious ERC20 token that attempts reentrancy attacks during transfers
 */
contract MaliciousReentrantToken is ERC20 {
    bool public isAttacking = false;
    IERC20Locker public targetLocker;
    uint256 public targetLockId;
    uint256 public attackCount = 0;
    uint256 public maxAttacks = 1;

    constructor(
        string memory name,
        string memory symbol,
        address initialHolder,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(initialHolder, initialSupply);
    }

    function setAttackParameters(
        address _targetLocker,
        uint256 _targetLockId,
        uint256 _maxAttacks
    ) external {
        targetLocker = IERC20Locker(_targetLocker);
        targetLockId = _targetLockId;
        maxAttacks = _maxAttacks;
    }

    function enableAttack() external {
        isAttacking = true;
        attackCount = 0;
    }

    function disableAttack() external {
        isAttacking = false;
        attackCount = 0;
    }

    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override {
        // Perform the transfer first
        super._update(from, to, amount);

        // Attempt reentrancy attack during outgoing transfers
        if (
            isAttacking &&
            from == address(targetLocker) &&
            attackCount < maxAttacks
        ) {
            attackCount++;
            try targetLocker.withdraw(targetLockId) {
                // Reentrancy succeeded (should not happen with ReentrancyGuard)
            } catch {
                // Expected to fail with ReentrancyGuard
            }
        }
    }
}
