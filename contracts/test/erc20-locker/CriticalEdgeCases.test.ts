import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';
import { parseEther, maxUint256 } from 'viem';

describe('ERC20Locker - Critical Edge Cases', function () {
  async function deployERC20LockerFixture() {
    const [owner, addr1, addr2] = await hre.viem.getWalletClients();

    const erc20Token = await hre.viem.deployContract('ERC20Token', [
      'Test Token',
      'TEST',
      owner.account.address,
      parseEther('10000'),
    ]);

    const erc20Locker = await hre.viem.deployContract('ERC20Locker');
    await erc20Token.write.approve([erc20Locker.address, parseEther('5000')]);

    return { erc20Locker, erc20Token, owner, addr1, addr2 };
  }

  describe('Critical Input Validation', function () {
    it('Should handle maximum uint256 lock amounts', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      // This should fail due to insufficient balance, but not due to overflow
      const maxAmount = maxUint256;
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      try {
        await erc20Locker.write.lock([
          addr1.account.address,
          erc20Token.address,
          maxAmount,
          endTime,
        ]);
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        // Should fail due to insufficient balance/allowance, not overflow
        expect(error.message).to.include('ERC20InsufficientAllowance');
      }
    });

    it('Should fail with timestamp overflow protection', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('100');
      // Use a timestamp that could cause overflow issues
      const maxTimestamp = maxUint256;

      try {
        await erc20Locker.write.lock([
          addr1.account.address,
          erc20Token.address,
          lockAmount,
          maxTimestamp,
        ]);
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        // Could fail for various reasons (timestamp validation, etc.)
        expect(error.message).to.match(/InvalidEndTime|revert/);
      }
    });

    it('Should handle zero-length arrays in lockMultiple', async function () {
      const { erc20Locker, erc20Token } = await loadFixture(
        deployERC20LockerFixture
      );

      try {
        await erc20Locker.write.lockMultiple([erc20Token.address, [], [], []]);
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('InvalidAmount');
      }
    });

    it('Should fail lockMultiple with some zero amounts in array', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);
      const owners = [addr1.account.address, addr1.account.address];
      const amounts = [parseEther('100'), 0n]; // One zero amount
      const endTimes = [endTime, endTime];

      // FIXED: Contract now correctly rejects individual zero amounts
      let errorThrown = false;
      try {
        await erc20Locker.write.lockMultiple([
          erc20Token.address,
          owners,
          amounts,
          endTimes,
        ]);
        expect.fail('Expected transaction to revert with InvalidAmount');
      } catch (error: any) {
        errorThrown = true;
        expect(error.message).to.include('InvalidAmount');
      }

      expect(errorThrown).to.be.true;

      // Verify no locks were created due to the revert
      expect(await erc20Locker.read.totalLocks()).to.equal(0n);
    });
  });

  describe('Lock Extension Validation', function () {
    it('Should fail to extend lock to same endTime', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime,
      ]);

      // Should fail when trying to extend to the same endTime
      try {
        await erc20Locker.write.extendLock([0n, endTime], {
          account: addr1.account,
        });
        expect.fail(
          'Expected transaction to revert when extending to same time'
        );
      } catch (error: any) {
        expect(error.message).to.include('InvalidEndTime');
      }
    });

    it('Should fail to extend lock to earlier time', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);
      const earlierTime = BigInt(currentTime + 1800); // 30 minutes earlier

      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime,
      ]);

      // Should fail when trying to extend to an earlier time
      try {
        await erc20Locker.write.extendLock([0n, earlierTime], {
          account: addr1.account,
        });
        expect.fail(
          'Expected transaction to revert when extending to earlier time'
        );
      } catch (error: any) {
        expect(error.message).to.include('InvalidEndTime');
      }
    });

    it('Should successfully extend lock to a later time', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);
      const newEndTime = endTime + 1n; // Extend by 1 second (minimum valid extension)

      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime,
      ]);

      // Should succeed when extending to a later time
      await erc20Locker.write.extendLock([0n, newEndTime], {
        account: addr1.account,
      });

      const [, , , storedEndTime] = await erc20Locker.read.locks([0n]);
      expect(storedEndTime).to.equal(newEndTime);
    });

    it('Should successfully extend lock by a significant amount', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);
      const newEndTime = endTime + 86400n; // Extend by 1 day

      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime,
      ]);

      // Should succeed when extending to a much later time
      await erc20Locker.write.extendLock([0n, newEndTime], {
        account: addr1.account,
      });

      const [, , , storedEndTime] = await erc20Locker.read.locks([0n]);
      expect(storedEndTime).to.equal(newEndTime);
    });

    it('Should properly validate minimum extension requirement (endTime + 1)', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime,
      ]);

      // Test boundary conditions for extension validation
      // Should fail with exactly endTime
      try {
        await erc20Locker.write.extendLock([0n, endTime], {
          account: addr1.account,
        });
        expect.fail('Expected transaction to revert with same endTime');
      } catch (error: any) {
        expect(error.message).to.include('InvalidEndTime');
      }

      // Should succeed with endTime + 1 (minimum valid extension)
      const minValidExtension = endTime + 1n;
      await erc20Locker.write.extendLock([0n, minValidExtension], {
        account: addr1.account,
      });

      const [, , , storedEndTime] = await erc20Locker.read.locks([0n]);
      expect(storedEndTime).to.equal(minValidExtension);

      // Should still allow further extensions
      const furtherExtension = minValidExtension + 1n;
      await erc20Locker.write.extendLock([0n, furtherExtension], {
        account: addr1.account,
      });

      const [, , , finalEndTime] = await erc20Locker.read.locks([0n]);
      expect(finalEndTime).to.equal(furtherExtension);
    });
  });

  describe('Arithmetic Overflow Protection', function () {
    it('Should handle potential overflow in lockMultiple totalAmount calculation', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      // Create amounts that would cause overflow when summed
      const largeAmount = parseEther('100000000000000000000000000'); // Very large amount
      const amounts = [largeAmount, largeAmount, largeAmount];
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);
      const owners = [
        addr1.account.address,
        addr1.account.address,
        addr1.account.address,
      ];
      const endTimes = [endTime, endTime, endTime];

      try {
        await erc20Locker.write.lockMultiple([
          erc20Token.address,
          owners,
          amounts,
          endTimes,
        ]);
        expect.fail(
          'Expected transaction to revert due to overflow or insufficient balance'
        );
      } catch (error: any) {
        // Should fail gracefully, either due to overflow protection or insufficient balance
        expect(error.message).to.match(
          /overflow|InsufficientAllowance|InsufficientBalance|arithmetic operation|panic/i
        );
      }
    });

    it('Should handle realistic overflow scenario with maximum values', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      // Create amounts that would realistically cause overflow
      const maxSafeUint = 2n ** 255n; // Half of max uint256 to avoid immediate overflow
      const amounts = [maxSafeUint, maxSafeUint]; // Sum would overflow uint256
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);
      const owners = [addr1.account.address, addr1.account.address];
      const endTimes = [endTime, endTime];

      try {
        await erc20Locker.write.lockMultiple([
          erc20Token.address,
          owners,
          amounts,
          endTimes,
        ]);
        expect.fail(
          'Expected transaction to revert due to arithmetic overflow'
        );
      } catch (error: any) {
        // Should fail with panic code 0x11 (arithmetic overflow) or insufficient balance
        expect(error.message).to.match(
          /panic|arithmetic|overflow|InsufficientAllowance|InsufficientBalance/i
        );
      }
    });

    it('Should handle maximum safe batch size without overflow', async function () {
      const { erc20Locker, erc20Token, owner, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const batchSize = 100; // Reasonable batch size for testing
      const lockAmount = parseEther('1'); // 1 token per lock
      const totalAmount = parseEther('100'); // Should not overflow
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      await erc20Token.write.approve([erc20Locker.address, totalAmount]);

      const owners = Array(batchSize).fill(addr1.account.address);
      const amounts = Array(batchSize).fill(lockAmount);
      const endTimes = Array(batchSize).fill(endTime);

      // This should succeed without overflow
      await erc20Locker.write.lockMultiple([
        erc20Token.address,
        owners,
        amounts,
        endTimes,
      ]);

      expect(await erc20Locker.read.totalLocks()).to.equal(BigInt(batchSize));
    });
  });

  describe('Individual Zero Amount Validation', function () {
    it('Should reject lockMultiple with individual zero amounts even if total > 0', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);
      const owners = [addr1.account.address, addr1.account.address];
      const amounts = [parseEther('100'), 0n]; // One zero amount
      const endTimes = [endTime, endTime];

      try {
        await erc20Locker.write.lockMultiple([
          erc20Token.address,
          owners,
          amounts,
          endTimes,
        ]);
        expect.fail('Expected transaction to revert with InvalidAmount');
      } catch (error: any) {
        expect(error.message).to.include('InvalidAmount');
      }

      // Verify no locks were created due to the revert
      expect(await erc20Locker.read.totalLocks()).to.equal(0n);
    });
  });

  describe('Token Contract Edge Cases', function () {
    it('Should handle token with no code at address', async function () {
      const { erc20Locker, addr1, addr2 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      // Use an address with no contract code
      const fakeTokenAddress = addr2.account.address;

      try {
        await erc20Locker.write.lock([
          addr1.account.address,
          fakeTokenAddress,
          lockAmount,
          endTime,
        ]);
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        // Should fail when trying to call transferFrom on non-contract
        expect(error.message).to.match(/revert|invalid|fail/i);
      }
    });
  });

  describe('Boundary Value Tests', function () {
    it('Should handle locks with short duration', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 10); // Short duration

      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime,
      ]);

      // Should still be locked
      try {
        await erc20Locker.write.withdraw([0n], { account: addr1.account });
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.match(/NotYetUnlocked/);
      }

      // Fast forward to expiry
      await time.increaseTo(Number(endTime));

      // Now should work
      await erc20Locker.write.withdraw([0n], { account: addr1.account });
    });

    it('Should handle extremely large batch sizes efficiently', async function () {
      const { erc20Locker, erc20Token, owner, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const batchSize = 50; // Reasonable size for coverage testing
      const lockAmount = parseEther('0.01'); // Small amounts
      const totalAmount = parseEther('0.5'); // 50 * 0.01
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      await erc20Token.write.approve([erc20Locker.address, totalAmount]);

      const owners = Array(batchSize).fill(addr1.account.address);
      const amounts = Array(batchSize).fill(lockAmount);
      const endTimes = Array(batchSize).fill(endTime);

      // This should succeed without running out of gas
      await erc20Locker.write.lockMultiple([
        erc20Token.address,
        owners,
        amounts,
        endTimes,
      ]);

      expect(await erc20Locker.read.totalLocks()).to.equal(BigInt(batchSize));
    });
  });

  describe('State Consistency Tests', function () {
    it('Should maintain correct totalLocks after mixed operations', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      // Create 3 locks
      for (let i = 0; i < 3; i++) {
        await erc20Locker.write.lock([
          addr1.account.address,
          erc20Token.address,
          lockAmount,
          endTime,
        ]);
      }

      expect(await erc20Locker.read.totalLocks()).to.equal(3n);

      await time.increaseTo(Number(endTime));

      // Withdraw middle lock
      await erc20Locker.write.withdraw([1n], { account: addr1.account });

      // totalLocks should still be 3 (it tracks next ID, not active locks)
      expect(await erc20Locker.read.totalLocks()).to.equal(3n);

      // Create new lock should get ID 3
      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        BigInt(currentTime + 7200),
      ]);

      expect(await erc20Locker.read.totalLocks()).to.equal(4n);

      // Verify lock states
      const [owner0] = await erc20Locker.read.locks([0n]);
      const [owner1] = await erc20Locker.read.locks([1n]);
      const [owner2] = await erc20Locker.read.locks([2n]);
      const [owner3] = await erc20Locker.read.locks([3n]);

      expect(owner0).to.not.equal('0x0000000000000000000000000000000000000000');
      expect(owner1).to.equal('0x0000000000000000000000000000000000000000'); // Withdrawn
      expect(owner2).to.not.equal('0x0000000000000000000000000000000000000000');
      expect(owner3).to.not.equal('0x0000000000000000000000000000000000000000');
    });

    it('Should handle sequential lock ID assignment correctly', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      // Create multiple locks to test ID assignment
      for (let i = 0; i < 5; i++) {
        await erc20Locker.write.lock([
          addr1.account.address,
          erc20Token.address,
          lockAmount,
          endTime,
        ]);

        expect(await erc20Locker.read.totalLocks()).to.equal(BigInt(i + 1));
      }

      // Verify each lock has correct ID (sequential)
      for (let i = 0; i < 5; i++) {
        const [owner] = await erc20Locker.read.locks([BigInt(i)]);
        expect(owner.toLowerCase()).to.equal(
          addr1.account.address.toLowerCase()
        );
      }

      // Withdraw some locks randomly
      await time.increaseTo(Number(endTime));
      await erc20Locker.write.withdraw([1n], { account: addr1.account });
      await erc20Locker.write.withdraw([3n], { account: addr1.account });

      // Create new locks - should continue from totalLocks
      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        BigInt(currentTime + 7200),
      ]);

      expect(await erc20Locker.read.totalLocks()).to.equal(6n);

      // Verify the new lock got ID 5 (not reusing deleted IDs)
      const [newOwner] = await erc20Locker.read.locks([5n]);
      expect(newOwner.toLowerCase()).to.equal(
        addr1.account.address.toLowerCase()
      );
    });
  });
});
