import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';
import { parseEther, decodeEventLog, getAddress } from 'viem';

describe('ERC20Locker - Fee Token Support', function () {
  async function deployERC20LockerFixture() {
    const [owner, addr1, addr2, addr3] = await hre.viem.getWalletClients();

    const erc20Token = await hre.viem.deployContract('ERC20Token', [
      'Test Token',
      'TEST',
      owner.account.address,
      parseEther('10000'),
    ]);

    const erc20Locker = await hre.viem.deployContract('ERC20Locker');

    await erc20Token.write.approve([erc20Locker.address, parseEther('5000')]);

    const publicClient = await hre.viem.getPublicClient();
    const erc20LockerArtifact = await hre.artifacts.readArtifact('ERC20Locker');

    return {
      erc20Locker,
      erc20LockerArtifact,
      erc20Token,
      owner,
      addr1,
      addr2,
      addr3,
      publicClient,
    };
  }

  async function deployFeeTokenFixture() {
    const [owner, addr1, addr2, addr3] = await hre.viem.getWalletClients();

    // Deploy fee token with 1% fee (100 basis points)
    const feeToken = await hre.viem.deployContract('MockFeeToken', [
      'Fee Token',
      'FEE',
      owner.account.address,
      parseEther('10000'),
      100n, // 1% fee
    ]);

    const erc20Locker = await hre.viem.deployContract('ERC20Locker');

    await feeToken.write.approve([erc20Locker.address, parseEther('5000')]);

    const publicClient = await hre.viem.getPublicClient();
    const erc20LockerArtifact = await hre.artifacts.readArtifact('ERC20Locker');

    return {
      erc20Locker,
      erc20LockerArtifact,
      feeToken,
      owner,
      addr1,
      addr2,
      addr3,
      publicClient,
    };
  }

  describe('Fee-on-Transfer Token Support', function () {
    it('Should fail to lock when fee is active', async function () {
      const { erc20Locker, feeToken, addr1 } = await loadFixture(
        deployFeeTokenFixture
      );

      // Fee token starts with 1% fee
      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      try {
        await erc20Locker.write.lock([
          addr1.account.address,
          feeToken.address,
          lockAmount,
          endTime,
        ]);
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('InexactTransfer');
      }
    });

    it('Should succeed to lock when fee is set to zero', async function () {
      const { erc20Locker, feeToken, addr1 } = await loadFixture(
        deployFeeTokenFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      // Set fee to 0
      await feeToken.write.setFeePercent([0n]);

      // Now locking should succeed
      await erc20Locker.write.lock([
        addr1.account.address,
        feeToken.address,
        lockAmount,
        endTime,
      ]);

      const [storedOwner, storedToken, storedAmount, storedEndTime] =
        await erc20Locker.read.locks([0n]);
      expect(storedOwner).to.equal(getAddress(addr1.account.address));
      expect(storedToken).to.equal(getAddress(feeToken.address));
      expect(storedAmount).to.equal(lockAmount);
      expect(storedEndTime).to.equal(endTime);
    });

    it('Should fail regular withdraw when fee is reactivated but succeed with withdrawUnsafe', async function () {
      const { erc20Locker, feeToken, addr1 } = await loadFixture(
        deployFeeTokenFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      // Set fee to 0 first to allow locking
      await feeToken.write.setFeePercent([0n]);

      // Lock tokens
      await erc20Locker.write.lock([
        addr1.account.address,
        feeToken.address,
        lockAmount,
        endTime,
      ]);

      // Wait for lock to expire
      await time.increaseTo(Number(endTime));

      // Reactivate fee (1%)
      await feeToken.write.setFeePercent([100n]);

      // Regular withdraw should fail due to exact amount check
      try {
        await erc20Locker.write.withdraw([0n], { account: addr1.account });
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('InexactTransfer');
      }

      // withdrawUnsafe should succeed even with fee
      const initialBalance = (await feeToken.read.balanceOf([
        addr1.account.address,
      ])) as bigint;

      await erc20Locker.write.withdrawUnsafe([0n], { account: addr1.account });

      const finalBalance = (await feeToken.read.balanceOf([
        addr1.account.address,
      ])) as bigint;

      // Should receive less than locked amount due to 1% fee
      const expectedAmount = lockAmount - (lockAmount * 100n) / 10000n; // 1% fee
      expect(finalBalance).to.equal(initialBalance + expectedAmount);

      // Verify lock is deleted
      const [deletedOwner] = await erc20Locker.read.locks([0n]);
      expect(deletedOwner).to.equal(
        '0x0000000000000000000000000000000000000000'
      );
    });

    it('Should handle multiple locks with fee tokens correctly', async function () {
      const { erc20Locker, feeToken, addr1, addr2 } = await loadFixture(
        deployFeeTokenFixture
      );

      const amounts = [parseEther('100'), parseEther('200')];
      const currentTime = await time.latest();
      const endTimes = [BigInt(currentTime + 3600), BigInt(currentTime + 7200)];
      const owners = [addr1.account.address, addr2.account.address];

      // Set fee to 0 for successful locking
      await feeToken.write.setFeePercent([0n]);

      await erc20Locker.write.lockMultiple([
        feeToken.address,
        owners,
        amounts,
        endTimes,
      ]);

      expect(await erc20Locker.read.totalLocks()).to.equal(2n);

      // Reactivate fee
      await feeToken.write.setFeePercent([100n]);

      await time.increaseTo(Number(endTimes[0]));

      // First lock withdrawUnsafe should work
      const initialAddr1Balance = (await feeToken.read.balanceOf([
        addr1.account.address,
      ])) as bigint;
      await erc20Locker.write.withdrawUnsafe([0n], { account: addr1.account });

      const finalAddr1Balance = (await feeToken.read.balanceOf([
        addr1.account.address,
      ])) as bigint;
      const expectedAmount1 = amounts[0] - (amounts[0] * 100n) / 10000n;
      expect(finalAddr1Balance).to.equal(initialAddr1Balance + expectedAmount1);

      // Second lock should still exist
      const [remainingOwner] = await erc20Locker.read.locks([1n]);
      expect(remainingOwner).to.equal(getAddress(addr2.account.address));
    });
  });

  describe('High Fee and Edge Case Scenarios', function () {
    it('Should handle high fee scenarios (5%)', async function () {
      const { erc20Locker, feeToken, addr1 } = await loadFixture(
        deployFeeTokenFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      // Set high fee (5%)
      await feeToken.write.setFeePercent([500n]);

      try {
        await erc20Locker.write.lock([
          addr1.account.address,
          feeToken.address,
          lockAmount,
          endTime,
        ]);
        expect.fail('Expected transaction to revert with high fee');
      } catch (error: any) {
        expect(error.message).to.include('InexactTransfer');
      }
    });

    it('Should handle maximum allowed fee (10%)', async function () {
      const { erc20Locker, feeToken, addr1 } = await loadFixture(
        deployFeeTokenFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      // Set maximum fee (10%)
      await feeToken.write.setFeePercent([1000n]);

      try {
        await erc20Locker.write.lock([
          addr1.account.address,
          feeToken.address,
          lockAmount,
          endTime,
        ]);
        expect.fail('Expected transaction to revert with maximum fee');
      } catch (error: any) {
        expect(error.message).to.include('InexactTransfer');
      }
    });

    it('Should handle fee changes during lock lifetime correctly', async function () {
      const { erc20Locker, feeToken, addr1 } = await loadFixture(
        deployFeeTokenFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      // Start with 0% fee
      await feeToken.write.setFeePercent([0n]);

      // Lock tokens successfully
      await erc20Locker.write.lock([
        addr1.account.address,
        feeToken.address,
        lockAmount,
        endTime,
      ]);

      // Change fee to 2% during lock period
      await feeToken.write.setFeePercent([200n]);

      await time.increaseTo(Number(endTime));

      // Regular withdraw should fail with fee active
      try {
        await erc20Locker.write.withdraw([0n], { account: addr1.account });
        expect.fail('Expected transaction to revert with fee active');
      } catch (error: any) {
        expect(error.message).to.include('InexactTransfer');
      }

      // withdrawUnsafe should work
      const initialBalance = await feeToken.read.balanceOf([
        addr1.account.address,
      ]);
      await erc20Locker.write.withdrawUnsafe([0n], { account: addr1.account });
      const finalBalance = await feeToken.read.balanceOf([
        addr1.account.address,
      ]);

      // Should receive 98% of locked amount (2% fee)
      const expectedAmount = lockAmount - (lockAmount * 200n) / 10000n;
      expect(finalBalance).to.equal(initialBalance + expectedAmount);
    });

    it('Should handle fee token in lockMultiple operations', async function () {
      const { erc20Locker, feeToken, addr1, addr2 } = await loadFixture(
        deployFeeTokenFixture
      );

      const amounts = [parseEther('100'), parseEther('200')];
      const currentTime = await time.latest();
      const endTimes = [BigInt(currentTime + 3600), BigInt(currentTime + 7200)];
      const owners = [addr1.account.address, addr2.account.address];

      // Set fee to 0 for locking
      await feeToken.write.setFeePercent([0n]);

      await erc20Locker.write.lockMultiple([
        feeToken.address,
        owners,
        amounts,
        endTimes,
      ]);

      // Activate fee before withdrawal
      await feeToken.write.setFeePercent([150n]); // 1.5% fee

      await time.increaseTo(Number(endTimes[0]));

      // First lock regular withdraw should fail
      try {
        await erc20Locker.write.withdraw([0n], { account: addr1.account });
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('InexactTransfer');
      }

      // withdrawUnsafe should work for first lock
      const initialBalance = await feeToken.read.balanceOf([
        addr1.account.address,
      ]);
      await erc20Locker.write.withdrawUnsafe([0n], { account: addr1.account });
      const finalBalance = await feeToken.read.balanceOf([
        addr1.account.address,
      ]);

      const expectedAmount = amounts[0] - (amounts[0] * 150n) / 10000n;
      expect(finalBalance).to.equal(initialBalance + expectedAmount);

      // Second lock should still exist and be withdrawable later
      const [remainingOwner] = await erc20Locker.read.locks([1n]);
      expect(remainingOwner).to.equal(getAddress(addr2.account.address));
    });

    it('Should handle 1 wei amounts with fee tokens', async function () {
      const { erc20Locker, feeToken, addr1 } = await loadFixture(
        deployFeeTokenFixture
      );

      const lockAmount = 1n; // 1 wei
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      // Set fee to 0 for locking
      await feeToken.write.setFeePercent([0n]);

      await erc20Locker.write.lock([
        addr1.account.address,
        feeToken.address,
        lockAmount,
        endTime,
      ]);

      await time.increaseTo(Number(endTime));

      // Activate small fee
      await feeToken.write.setFeePercent([100n]); // 1% fee

      // For 1 wei with 1% fee, actual fee would be 0 (rounded down)
      // So regular withdraw might work depending on implementation
      const initialBalance = await feeToken.read.balanceOf([
        addr1.account.address,
      ]);

      try {
        await erc20Locker.write.withdraw([0n], { account: addr1.account });
        // If it succeeds, verify amount
        const finalBalance = await feeToken.read.balanceOf([
          addr1.account.address,
        ]);
        expect(Number(finalBalance)).to.be.gte(Number(initialBalance)); // Should receive at least initial balance
      } catch (error: any) {
        // If it fails, withdrawUnsafe should work
        expect(error.message).to.include('InexactTransfer');
        await erc20Locker.write.withdrawUnsafe([0n], {
          account: addr1.account,
        });
        const finalBalance = await feeToken.read.balanceOf([
          addr1.account.address,
        ]);
        expect(Number(finalBalance)).to.be.gte(Number(initialBalance));
      }
    });
  });
});
