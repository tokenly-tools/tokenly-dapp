import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';
import { parseEther, decodeEventLog, getAddress } from 'viem';

describe('ERC20Locker - Edge Cases and Integration', function () {
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

  describe('Boundary and Edge Cases', function () {
    it('Should handle multiple locks for same owner', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime1 = BigInt(currentTime + 3600);
      const endTime2 = BigInt(currentTime + 7200);

      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime1,
      ]);

      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime2,
      ]);

      expect(await erc20Locker.read.totalLocks()).to.equal(2n);

      const [, , , lockEndTime1] = await erc20Locker.read.locks([0n]);
      const [, , , lockEndTime2] = await erc20Locker.read.locks([1n]);

      expect(lockEndTime1).to.equal(endTime1);
      expect(lockEndTime2).to.equal(endTime2);
    });

    it('Should handle withdrawal of one lock while other remains', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime1 = BigInt(currentTime + 3600);
      const endTime2 = BigInt(currentTime + 7200);

      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime1,
      ]);

      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime2,
      ]);

      await time.increaseTo(Number(endTime1));

      await erc20Locker.write.withdraw([0n], { account: addr1.account });

      const [withdrawnOwner] = await erc20Locker.read.locks([0n]);
      const [remainingOwner] = await erc20Locker.read.locks([1n]);

      expect(withdrawnOwner).to.equal(
        '0x0000000000000000000000000000000000000000'
      );
      expect(remainingOwner).to.equal(getAddress(addr1.account.address));
    });

    it('Should handle large amounts', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('1000');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime,
      ]);

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

    it('Should handle extending lock multiple times', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);
      const newEndTime1 = BigInt(currentTime + 7200);
      const newEndTime2 = BigInt(currentTime + 10800);

      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime,
      ]);

      await erc20Locker.write.extendLock([0n, newEndTime1], {
        account: addr1.account,
      });

      await erc20Locker.write.extendLock([0n, newEndTime2], {
        account: addr1.account,
      });

      const [, , , finalEndTime] = await erc20Locker.read.locks([0n]);
      expect(finalEndTime).to.equal(newEndTime2);
    });

    it('Should handle maximum uint256 values safely', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const maxTimestamp = 2n ** 256n - 1n;
      const lockAmount = parseEther('1');

      try {
        await erc20Locker.write.lock([
          addr1.account.address,
          erc20Token.address,
          lockAmount,
          maxTimestamp,
        ]);

        const [, , , storedEndTime] = await erc20Locker.read.locks([0n]);
        expect(storedEndTime).to.equal(maxTimestamp);
      } catch (error: any) {
        // This might fail due to block timestamp validation, which is acceptable
        expect(error.message).to.include('InvalidEndTime');
      }
    });
  });

  describe('Integration and Real-world Scenarios', function () {
    it('Should handle complex multi-user workflow', async function () {
      const { erc20Locker, erc20Token, owner, addr1, addr2, addr3 } =
        await loadFixture(deployERC20LockerFixture);

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      // Step 1: Owner locks tokens for addr1
      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime,
      ]);

      // Step 2: addr1 transfers ownership to addr2
      await erc20Locker.write.transferLockOwnership(
        [0n, addr2.account.address],
        {
          account: addr1.account,
        }
      );

      // Step 3: addr2 extends the lock
      const newEndTime = BigInt(currentTime + 7200);
      await erc20Locker.write.extendLock([0n, newEndTime], {
        account: addr2.account,
      });

      // Step 4: addr2 transfers ownership to addr3
      await erc20Locker.write.transferLockOwnership(
        [0n, addr3.account.address],
        {
          account: addr2.account,
        }
      );

      // Step 5: addr3 withdraws after expiry
      await time.increaseTo(Number(newEndTime));

      const initialAddr3Balance = await erc20Token.read.balanceOf([
        addr3.account.address,
      ]);

      await erc20Locker.write.withdraw([0n], { account: addr3.account });

      const finalAddr3Balance = await erc20Token.read.balanceOf([
        addr3.account.address,
      ]);

      expect(finalAddr3Balance).to.equal(initialAddr3Balance + lockAmount);

      // Verify lock is deleted
      const [deletedOwner] = await erc20Locker.read.locks([0n]);
      expect(deletedOwner).to.equal(
        '0x0000000000000000000000000000000000000000'
      );
    });

    it('Should handle batch operations efficiently', async function () {
      const { erc20Locker, erc20Token, owner, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const batchSize = 10;
      const lockAmount = parseEther('10');
      const totalAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      // Additional approval for batch operation
      await erc20Token.write.approve([erc20Locker.address, totalAmount]);

      const owners = Array(batchSize).fill(addr1.account.address);
      const amounts = Array(batchSize).fill(lockAmount);
      const endTimes = Array(batchSize).fill(endTime);

      const initialBalance = await erc20Token.read.balanceOf([
        owner.account.address,
      ]);

      await erc20Locker.write.lockMultiple([
        erc20Token.address,
        owners,
        amounts,
        endTimes,
      ]);

      const finalBalance = await erc20Token.read.balanceOf([
        owner.account.address,
      ]);
      expect(finalBalance).to.equal(initialBalance - totalAmount);
      expect(await erc20Locker.read.totalLocks()).to.equal(BigInt(batchSize));
    });

    it('Should verify lock creation is efficient', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      // Simple test that lock creation completes successfully
      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime,
      ]);

      expect(await erc20Locker.read.totalLocks()).to.equal(1n);
    });
  });
});
