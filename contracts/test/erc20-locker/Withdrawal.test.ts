import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';
import { parseEther, decodeEventLog, getAddress } from 'viem';

describe('ERC20Locker - Withdrawal', function () {
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

  describe('Withdrawal', function () {
    it('Should allow withdrawal after lock expires', async function () {
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

      await time.increaseTo(Number(endTime));

      const initialAddr1Balance = await erc20Token.read.balanceOf([
        addr1.account.address,
      ]);

      await erc20Locker.write.withdraw([0n], { account: addr1.account });

      const finalAddr1Balance = await erc20Token.read.balanceOf([
        addr1.account.address,
      ]);

      expect(finalAddr1Balance).to.equal(initialAddr1Balance + lockAmount);
    });

    it('Should emit Withdrawn event with correct parameters', async function () {
      const {
        erc20Locker,
        erc20LockerArtifact,
        erc20Token,
        addr1,
        publicClient,
      } = await loadFixture(deployERC20LockerFixture);

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime,
      ]);

      await time.increaseTo(Number(endTime));

      const hash = await erc20Locker.write.withdraw([0n], {
        account: addr1.account,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const withdrawnLog = receipt.logs.find(
        log => log.address.toLowerCase() === erc20Locker.address.toLowerCase()
      );
      expect(withdrawnLog).to.not.be.undefined;

      const decodedLog = decodeEventLog({
        abi: erc20LockerArtifact.abi,
        data: withdrawnLog!.data,
        topics: withdrawnLog!.topics,
        eventName: 'Withdrawn',
      });

      expect(decodedLog.args.lockId).to.equal(0n);
      expect(decodedLog.args.amount).to.equal(lockAmount);
    });

    it('Should delete lock after withdrawal', async function () {
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

      await time.increaseTo(Number(endTime));
      await erc20Locker.write.withdraw([0n], { account: addr1.account });

      const [deletedOwner, deletedToken, deletedAmount, deletedEndTime] =
        await erc20Locker.read.locks([0n]);
      expect(deletedOwner).to.equal(
        '0x0000000000000000000000000000000000000000'
      );
      expect(deletedToken).to.equal(
        '0x0000000000000000000000000000000000000000'
      );
      expect(deletedAmount).to.equal(0n);
      expect(deletedEndTime).to.equal(0n);
    });

    it('Should fail withdrawal before lock expires', async function () {
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

      try {
        await erc20Locker.write.withdraw([0n], { account: addr1.account });
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('NotYetUnlocked');
      }
    });

    it('Should fail withdrawal by non-owner', async function () {
      const { erc20Locker, erc20Token, addr1, addr2 } = await loadFixture(
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

      await time.increaseTo(Number(endTime));

      try {
        await erc20Locker.write.withdraw([0n], { account: addr2.account });
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('NotLockOwner');
      }
    });

    it('Should fail withdrawal of non-existent lock', async function () {
      const { erc20Locker, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      try {
        await erc20Locker.write.withdraw([999n], { account: addr1.account });
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('NotLockOwner');
      }
    });

    it('Should prevent double withdrawal of same lock', async function () {
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

      await time.increaseTo(Number(endTime));

      // First withdrawal should succeed
      await erc20Locker.write.withdraw([0n], { account: addr1.account });

      // Second withdrawal should fail
      try {
        await erc20Locker.write.withdraw([0n], { account: addr1.account });
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('NotLockOwner');
      }
    });

    it('Should maintain correct contract balance after withdrawals', async function () {
      const { erc20Locker, erc20Token, addr1, addr2 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount1 = parseEther('100');
      const lockAmount2 = parseEther('200');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      // Create two locks
      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount1,
        endTime,
      ]);

      await erc20Locker.write.lock([
        addr2.account.address,
        erc20Token.address,
        lockAmount2,
        endTime,
      ]);

      const contractBalanceAfterLocks = await erc20Token.read.balanceOf([
        erc20Locker.address,
      ]);
      expect(contractBalanceAfterLocks).to.equal(lockAmount1 + lockAmount2);

      await time.increaseTo(Number(endTime));

      // Withdraw first lock
      await erc20Locker.write.withdraw([0n], { account: addr1.account });

      const contractBalanceAfterFirstWithdrawal =
        await erc20Token.read.balanceOf([erc20Locker.address]);
      expect(contractBalanceAfterFirstWithdrawal).to.equal(lockAmount2);

      // Withdraw second lock
      await erc20Locker.write.withdraw([1n], { account: addr2.account });

      const contractBalanceAfterSecondWithdrawal =
        await erc20Token.read.balanceOf([erc20Locker.address]);
      expect(contractBalanceAfterSecondWithdrawal).to.equal(0n);
    });
  });
});
