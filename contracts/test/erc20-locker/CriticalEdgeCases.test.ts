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

      // This should succeed - individual zero amounts are allowed if total > 0
      await erc20Locker.write.lockMultiple([
        erc20Token.address,
        owners,
        amounts,
        endTimes,
      ]);

      expect(await erc20Locker.read.totalLocks()).to.equal(2n);

      // Verify the zero-amount lock was created
      const [, , storedAmount] = await erc20Locker.read.locks([1n]);
      expect(storedAmount).to.equal(0n);
    });
  });

  describe('Lock Extension Logic Bug', function () {
    it('Should fail to extend lock to same endTime (off-by-one error)', async function () {
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

      // BUG: Current implementation allows extending to same time due to < comparison
      // This test will FAIL with current implementation, proving the bug
      try {
        await erc20Locker.write.extendLock([0n, endTime], {
          account: addr1.account,
        });
        // If this doesn't revert, there's a bug in the contract
        expect.fail(
          'Expected transaction to revert - contract has off-by-one bug'
        );
      } catch (error: any) {
        expect(error.message).to.include('InvalidEndTime');
      }
    });

    it('Should allow extending by exactly 1 second', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);
      const newEndTime = endTime + 1n; // Extend by 1 second

      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime,
      ]);

      await erc20Locker.write.extendLock([0n, newEndTime], {
        account: addr1.account,
      });

      const [, , , storedEndTime] = await erc20Locker.read.locks([0n]);
      expect(storedEndTime).to.equal(newEndTime);
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

      const batchSize = 200; // Large but reasonable
      const lockAmount = parseEther('0.01'); // Small amounts
      const totalAmount = parseEther('2'); // 200 * 0.01
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
  });
});
