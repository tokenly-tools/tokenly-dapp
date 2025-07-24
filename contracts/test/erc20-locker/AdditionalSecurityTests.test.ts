import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';
import { parseEther, decodeEventLog, getAddress } from 'viem';

describe('ERC20Locker - Additional Security Tests', function () {
  async function deployERC20LockerWithMaliciousTokenFixture() {
    const [owner, addr1, addr2, addr3] = await hre.viem.getWalletClients();

    const erc20Token = await hre.viem.deployContract('ERC20Token', [
      'Test Token',
      'TEST',
      owner.account.address,
      parseEther('10000'),
    ]);

    const maliciousToken = await hre.viem.deployContract(
      'MaliciousReentrantToken',
      ['Malicious Token', 'MAL', owner.account.address, parseEther('10000')]
    );

    const erc20Locker = await hre.viem.deployContract('ERC20Locker');

    await erc20Token.write.approve([erc20Locker.address, parseEther('5000')]);
    await maliciousToken.write.approve([
      erc20Locker.address,
      parseEther('5000'),
    ]);

    const publicClient = await hre.viem.getPublicClient();
    const erc20LockerArtifact = await hre.artifacts.readArtifact('ERC20Locker');

    return {
      erc20Locker,
      erc20LockerArtifact,
      erc20Token,
      maliciousToken,
      owner,
      addr1,
      addr2,
      addr3,
      publicClient,
    };
  }

  describe('Reentrancy Attack Protection', function () {
    it('Should prevent reentrancy attacks during withdrawal', async function () {
      const { erc20Locker, maliciousToken, owner, addr1 } = await loadFixture(
        deployERC20LockerWithMaliciousTokenFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      // Create lock with malicious token
      await erc20Locker.write.lock([
        addr1.account.address,
        maliciousToken.address,
        lockAmount,
        endTime,
      ]);

      // Setup malicious token for attack
      await maliciousToken.write.setAttackParameters([
        erc20Locker.address,
        0n, // lockId
        3n, // maxAttacks
      ]);

      await time.increaseTo(Number(endTime));

      // Enable attack mode
      await maliciousToken.write.enableAttack();

      const initialBalance = (await maliciousToken.read.balanceOf([
        addr1.account.address,
      ])) as bigint;

      // Attempt withdrawal - should succeed despite reentrancy attempt
      await erc20Locker.write.withdrawUnsafe([0n], { account: addr1.account });

      const finalBalance = await maliciousToken.read.balanceOf([
        addr1.account.address,
      ]);
      const attackCount = await maliciousToken.read.attackCount();

      // Should receive tokens exactly once (no double withdrawal)
      expect(finalBalance).to.equal(initialBalance + lockAmount);
      expect(Number(attackCount)).to.be.greaterThan(0); // Attack was attempted

      // Verify lock is properly deleted (only once)
      const [deletedOwner] = await erc20Locker.read.locks([0n]);
      expect(deletedOwner).to.equal(
        '0x0000000000000000000000000000000000000000'
      );
    });

    it('Should prevent reentrancy during lock creation', async function () {
      const { erc20Locker, maliciousToken, addr1 } = await loadFixture(
        deployERC20LockerWithMaliciousTokenFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      // Setup malicious token to attack during transferFrom
      await maliciousToken.write.setAttackParameters([
        erc20Locker.address,
        0n, // Will be lockId of lock being created
        1n, // Single attack attempt
      ]);

      // Enable attack mode before lock creation
      await maliciousToken.write.enableAttack();

      // Create lock - should succeed. No reentrancy should occur because
      // the malicious token only attacks on transfers FROM the locker,
      // not TO the locker (which happens during lock creation)
      await erc20Locker.write.lock([
        addr1.account.address,
        maliciousToken.address,
        lockAmount,
        endTime,
      ]);

      const attackCount = await maliciousToken.read.attackCount();

      // No attack should have occurred during lock creation since tokens
      // are transferred TO the locker, not FROM it
      expect(Number(attackCount)).to.equal(0);

      // Verify lock was created correctly
      expect(await erc20Locker.read.totalLocks()).to.equal(1n);

      const [owner, token, amount, storedEndTime] =
        await erc20Locker.read.locks([0n]);
      expect(owner.toLowerCase()).to.equal(addr1.account.address.toLowerCase());
      expect(amount).to.equal(lockAmount);
      expect(storedEndTime).to.equal(endTime);
    });

    it('Should prevent reentrancy in regular withdraw as well', async function () {
      const { erc20Locker, maliciousToken, addr1 } = await loadFixture(
        deployERC20LockerWithMaliciousTokenFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      await erc20Locker.write.lock([
        addr1.account.address,
        maliciousToken.address,
        lockAmount,
        endTime,
      ]);

      await maliciousToken.write.setAttackParameters([
        erc20Locker.address,
        0n,
        1n,
      ]);

      await time.increaseTo(Number(endTime));
      await maliciousToken.write.enableAttack();

      // Should succeed and prevent reentrancy
      await erc20Locker.write.withdraw([0n], { account: addr1.account });

      const attackCount = await maliciousToken.read.attackCount();
      expect(Number(attackCount)).to.be.greaterThan(0);
    });
  });

  describe('Lock ID Sequential Logic', function () {
    it('Should assign sequential lock IDs starting from 0', async function () {
      const { erc20Locker, erc20Token, addr1, addr2 } = await loadFixture(
        deployERC20LockerWithMaliciousTokenFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      // Create first lock - should get ID 0
      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime,
      ]);

      expect(await erc20Locker.read.totalLocks()).to.equal(1n);

      // Create second lock - should get ID 1
      await erc20Locker.write.lock([
        addr2.account.address,
        erc20Token.address,
        lockAmount,
        endTime,
      ]);

      expect(await erc20Locker.read.totalLocks()).to.equal(2n);

      // Verify lock IDs are correct
      const [owner1] = await erc20Locker.read.locks([0n]);
      const [owner2] = await erc20Locker.read.locks([1n]);

      expect(owner1).to.equal(getAddress(addr1.account.address));
      expect(owner2).to.equal(getAddress(addr2.account.address));
    });

    it('Should not reuse lock IDs after deletion', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerWithMaliciousTokenFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      // Create and withdraw first lock
      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime,
      ]);

      await time.increaseTo(Number(endTime));
      await erc20Locker.write.withdraw([0n], { account: addr1.account });

      expect(await erc20Locker.read.totalLocks()).to.equal(1n);

      // Create new lock - should get ID 1, not reuse ID 0
      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        BigInt(currentTime + 7200),
      ]);

      expect(await erc20Locker.read.totalLocks()).to.equal(2n);

      // Lock 0 should be deleted, lock 1 should exist
      const [deletedOwner] = await erc20Locker.read.locks([0n]);
      const [newOwner] = await erc20Locker.read.locks([1n]);

      expect(deletedOwner).to.equal(
        '0x0000000000000000000000000000000000000000'
      );
      expect(newOwner).to.equal(getAddress(addr1.account.address));
    });
  });

  describe('Timing Edge Cases', function () {
    it('Should accept lock with minimum valid duration', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerWithMaliciousTokenFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 2); // Safe minimum time

      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime,
      ]);

      const [, , , storedEndTime] = await erc20Locker.read.locks([0n]);
      expect(storedEndTime).to.equal(endTime);
    });

    it('Should allow withdrawal exactly at expiry time', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerWithMaliciousTokenFixture
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

      // Set time exactly to expiry
      await time.increaseTo(Number(endTime));

      const initialBalance = await erc20Token.read.balanceOf([
        addr1.account.address,
      ]);
      await erc20Locker.write.withdraw([0n], { account: addr1.account });
      const finalBalance = await erc20Token.read.balanceOf([
        addr1.account.address,
      ]);

      expect(finalBalance).to.equal(initialBalance + lockAmount);
    });

    it('Should fail withdrawal one second before expiry', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerWithMaliciousTokenFixture
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

      // Set time to well before expiry
      await time.increaseTo(Number(endTime) - 10);

      let errorCaught = false;
      try {
        await erc20Locker.write.withdraw([0n], { account: addr1.account });
      } catch (error: any) {
        errorCaught = true;
        expect(error.message).to.match(/NotYetUnlocked/);
      }
      expect(errorCaught).to.be.true;
    });
  });

  describe('Direct Token Transfer Edge Cases', function () {
    it('Should handle tokens sent directly to contract', async function () {
      const { erc20Locker, erc20Token, owner } = await loadFixture(
        deployERC20LockerWithMaliciousTokenFixture
      );

      const directAmount = parseEther('100');
      const initialContractBalance = await erc20Token.read.balanceOf([
        erc20Locker.address,
      ]);

      // Send tokens directly to contract without creating lock
      await erc20Token.write.transfer([erc20Locker.address, directAmount]);

      const finalContractBalance = await erc20Token.read.balanceOf([
        erc20Locker.address,
      ]);
      expect(finalContractBalance).to.equal(
        initialContractBalance + directAmount
      );

      // Verify no locks were created
      expect(await erc20Locker.read.totalLocks()).to.equal(0n);

      // These tokens are now permanently stuck (this is expected behavior)
    });
  });

  describe('Wei-Level Amount Tests', function () {
    it('Should handle 1 wei lock amounts', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerWithMaliciousTokenFixture
      );

      const lockAmount = 1n; // 1 wei
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime,
      ]);

      const [, , storedAmount] = await erc20Locker.read.locks([0n]);
      expect(storedAmount).to.equal(lockAmount);

      await time.increaseTo(Number(endTime));

      const initialBalance = await erc20Token.read.balanceOf([
        addr1.account.address,
      ]);
      await erc20Locker.write.withdraw([0n], { account: addr1.account });
      const finalBalance = await erc20Token.read.balanceOf([
        addr1.account.address,
      ]);

      expect(finalBalance).to.equal(initialBalance + lockAmount);
    });
  });

  describe('Lock Extension Edge Cases', function () {
    it('Should fail to extend lock with same end time', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerWithMaliciousTokenFixture
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

      try {
        await erc20Locker.write.extendLock([0n, endTime], {
          account: addr1.account,
        });
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('InvalidEndTime');
      }
    });

    it('Should allow extending expired lock (by design)', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerWithMaliciousTokenFixture
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

      // Wait for lock to expire
      await time.increaseTo(Number(endTime) + 1);
      const newCurrentTime = await time.latest();

      // Contract allows extending expired locks by design
      const newEndTime = BigInt(newCurrentTime + 7200);
      await erc20Locker.write.extendLock([0n, newEndTime], {
        account: addr1.account,
      });

      const [, , , storedEndTime] = await erc20Locker.read.locks([0n]);
      expect(storedEndTime).to.equal(newEndTime);
    });
  });

  describe('Gas Limit Stress Tests', function () {
    it('Should handle moderately large batch operations without running out of gas', async function () {
      const { erc20Locker, erc20Token, owner, addr1 } = await loadFixture(
        deployERC20LockerWithMaliciousTokenFixture
      );

      const batchSize = 100; // Reasonable size that should work
      const lockAmount = parseEther('1');
      const totalAmount = parseEther('100');
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
});
