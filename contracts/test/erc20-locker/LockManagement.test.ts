import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';
import { parseEther, decodeEventLog, getAddress } from 'viem';

describe('ERC20Locker - Lock Management', function () {
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

  describe('Lock Extension', function () {
    it('Should extend lock end time', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);
      const newEndTime = BigInt(currentTime + 7200);

      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime,
      ]);

      await erc20Locker.write.extendLock([0n, newEndTime], {
        account: addr1.account,
      });

      const [, , , updatedEndTime] = await erc20Locker.read.locks([0n]);
      expect(updatedEndTime).to.equal(newEndTime);
    });

    it('Should emit LockExtended event with correct parameters', async function () {
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
      const newEndTime = BigInt(currentTime + 7200);

      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime,
      ]);

      const hash = await erc20Locker.write.extendLock([0n, newEndTime], {
        account: addr1.account,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const extendedLog = receipt.logs.find(
        log => log.address.toLowerCase() === erc20Locker.address.toLowerCase()
      );
      expect(extendedLog).to.not.be.undefined;

      const decodedLog = decodeEventLog({
        abi: erc20LockerArtifact.abi,
        data: extendedLog!.data,
        topics: extendedLog!.topics,
        eventName: 'LockExtended',
      });

      expect(decodedLog.args.lockId).to.equal(0n);
      expect(decodedLog.args.newEndTime).to.equal(newEndTime);
    });

    it('Should fail to extend lock by non-owner', async function () {
      const { erc20Locker, erc20Token, addr1, addr2 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);
      const newEndTime = BigInt(currentTime + 7200);

      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime,
      ]);

      try {
        await erc20Locker.write.extendLock([0n, newEndTime], {
          account: addr2.account,
        });
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('NotLockOwner');
      }
    });

    it('Should fail to extend lock with earlier time', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);
      const earlierEndTime = BigInt(currentTime + 1800);

      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime,
      ]);

      try {
        await erc20Locker.write.extendLock([0n, earlierEndTime], {
          account: addr1.account,
        });
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('InvalidEndTime');
      }
    });

    it('Should fail to extend non-existent lock', async function () {
      const { erc20Locker, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const currentTime = await time.latest();
      const newEndTime = BigInt(currentTime + 7200);

      try {
        await erc20Locker.write.extendLock([999n, newEndTime], {
          account: addr1.account,
        });
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('NotLockOwner');
      }
    });
  });

  describe('Lock Ownership Transfer', function () {
    it('Should transfer lock ownership', async function () {
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

      await erc20Locker.write.transferLockOwnership(
        [0n, addr2.account.address],
        {
          account: addr1.account,
        }
      );

      const [newOwner] = await erc20Locker.read.locks([0n]);
      expect(newOwner).to.equal(getAddress(addr2.account.address));
    });

    it('Should emit LockOwnershipTransferred event with correct parameters', async function () {
      const {
        erc20Locker,
        erc20LockerArtifact,
        erc20Token,
        addr1,
        addr2,
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

      const hash = await erc20Locker.write.transferLockOwnership(
        [0n, addr2.account.address],
        {
          account: addr1.account,
        }
      );

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const transferLog = receipt.logs.find(
        log => log.address.toLowerCase() === erc20Locker.address.toLowerCase()
      );
      expect(transferLog).to.not.be.undefined;

      const decodedLog = decodeEventLog({
        abi: erc20LockerArtifact.abi,
        data: transferLog!.data,
        topics: transferLog!.topics,
        eventName: 'LockOwnershipTransferred',
      });

      expect(decodedLog.args.lockId).to.equal(0n);
      expect(decodedLog.args.newOwner.toLowerCase()).to.equal(
        addr2.account.address.toLowerCase()
      );
    });

    it('Should allow new owner to manage lock', async function () {
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

      await erc20Locker.write.transferLockOwnership(
        [0n, addr2.account.address],
        {
          account: addr1.account,
        }
      );

      await time.increaseTo(Number(endTime));

      const initialAddr2Balance = await erc20Token.read.balanceOf([
        addr2.account.address,
      ]);

      await erc20Locker.write.withdraw([0n], { account: addr2.account });

      const finalAddr2Balance = await erc20Token.read.balanceOf([
        addr2.account.address,
      ]);

      expect(finalAddr2Balance).to.equal(initialAddr2Balance + lockAmount);
    });

    it('Should fail to transfer ownership by non-owner', async function () {
      const { erc20Locker, erc20Token, addr1, addr2, addr3 } =
        await loadFixture(deployERC20LockerFixture);

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
        await erc20Locker.write.transferLockOwnership(
          [0n, addr3.account.address],
          {
            account: addr2.account,
          }
        );
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('NotLockOwner');
      }
    });

    it('Should fail to transfer ownership to zero address', async function () {
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
        await erc20Locker.write.transferLockOwnership(
          [0n, '0x0000000000000000000000000000000000000000'],
          {
            account: addr1.account,
          }
        );
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('InvalidOwner');
      }
    });

    it('Should completely lock out old owner after ownership transfer', async function () {
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

      // Transfer ownership
      await erc20Locker.write.transferLockOwnership(
        [0n, addr2.account.address],
        {
          account: addr1.account,
        }
      );

      const newEndTime = BigInt(currentTime + 7200);

      // Old owner should be locked out of all operations
      try {
        await erc20Locker.write.extendLock([0n, newEndTime], {
          account: addr1.account,
        });
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('NotLockOwner');
      }

      try {
        await erc20Locker.write.transferLockOwnership(
          [0n, addr1.account.address],
          {
            account: addr1.account,
          }
        );
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('NotLockOwner');
      }

      await time.increaseTo(Number(endTime));

      try {
        await erc20Locker.write.withdraw([0n], { account: addr1.account });
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('NotLockOwner');
      }

      // Verify new owner still has access
      await erc20Locker.write.withdraw([0n], { account: addr2.account });
    });
  });

  describe('Lock Ownership Renunciation', function () {
    it('Should renounce lock ownership', async function () {
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

      await erc20Locker.write.renounceLockOwnership([0n], {
        account: addr1.account,
      });

      const [renouncedOwner] = await erc20Locker.read.locks([0n]);
      expect(renouncedOwner).to.equal(
        '0x0000000000000000000000000000000000000000'
      );
    });

    it('Should emit LockOwnershipTransferred event with zero address', async function () {
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

      const hash = await erc20Locker.write.renounceLockOwnership([0n], {
        account: addr1.account,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const renounceLog = receipt.logs.find(
        log => log.address.toLowerCase() === erc20Locker.address.toLowerCase()
      );
      expect(renounceLog).to.not.be.undefined;

      const decodedLog = decodeEventLog({
        abi: erc20LockerArtifact.abi,
        data: renounceLog!.data,
        topics: renounceLog!.topics,
        eventName: 'LockOwnershipTransferred',
      });

      expect(decodedLog.args.lockId).to.equal(0n);
      expect(decodedLog.args.newOwner).to.equal(
        '0x0000000000000000000000000000000000000000'
      );
    });

    it('Should make lock permanently unmanageable after renunciation', async function () {
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

      await erc20Locker.write.renounceLockOwnership([0n], {
        account: addr1.account,
      });

      await time.increaseTo(Number(endTime));

      try {
        await erc20Locker.write.withdraw([0n], { account: addr1.account });
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('NotLockOwner');
      }
    });

    it('Should reject ALL operations on renounced locks', async function () {
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

      // Renounce ownership
      await erc20Locker.write.renounceLockOwnership([0n], {
        account: addr1.account,
      });

      const newEndTime = BigInt(currentTime + 7200);

      // All management operations should fail with zero address owner
      try {
        await erc20Locker.write.extendLock([0n, newEndTime], {
          account: addr1.account,
        });
        expect.fail('Expected extendLock to revert');
      } catch (error: any) {
        expect(error.message).to.include('NotLockOwner');
      }

      try {
        await erc20Locker.write.transferLockOwnership(
          [0n, addr2.account.address],
          {
            account: addr1.account,
          }
        );
        expect.fail('Expected transferLockOwnership to revert');
      } catch (error: any) {
        expect(error.message).to.include('NotLockOwner');
      }

      try {
        await erc20Locker.write.renounceLockOwnership([0n], {
          account: addr1.account,
        });
        expect.fail('Expected renounceLockOwnership to revert');
      } catch (error: any) {
        expect(error.message).to.include('NotLockOwner');
      }

      await time.increaseTo(Number(endTime));

      try {
        await erc20Locker.write.withdraw([0n], { account: addr1.account });
        expect.fail('Expected withdraw to revert');
      } catch (error: any) {
        expect(error.message).to.include('NotLockOwner');
      }

      try {
        await erc20Locker.write.withdrawUnsafe([0n], {
          account: addr1.account,
        });
        expect.fail('Expected withdrawUnsafe to revert');
      } catch (error: any) {
        expect(error.message).to.include('NotLockOwner');
      }

      // Verify tokens are permanently locked (this is the intended behavior)
      const contractBalance = await erc20Token.read.balanceOf([
        erc20Locker.address,
      ]);
      expect(contractBalance).to.equal(lockAmount);
    });

    it('Should fail to renounce ownership by non-owner', async function () {
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

      try {
        await erc20Locker.write.renounceLockOwnership([0n], {
          account: addr2.account,
        });
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('NotLockOwner');
      }
    });
  });
});
