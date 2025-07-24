import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';
import { parseEther, decodeEventLog, getAddress } from 'viem';

describe('ERC20Locker - Basic Functionality', function () {
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

  describe('Deployment', function () {
    it('Should deploy with correct initial state', async function () {
      const { erc20Locker } = await loadFixture(deployERC20LockerFixture);

      expect(await erc20Locker.read.totalLocks()).to.equal(0n);
    });
  });

  describe('Single Lock Creation', function () {
    it('Should create a lock with correct details', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      const hash = await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime,
      ]);

      const [storedOwner, storedToken, storedAmount, storedEndTime] =
        await erc20Locker.read.locks([0n]);
      expect(storedOwner).to.equal(getAddress(addr1.account.address));
      expect(storedToken).to.equal(getAddress(erc20Token.address));
      expect(storedAmount).to.equal(lockAmount);
      expect(storedEndTime).to.equal(endTime);

      expect(await erc20Locker.read.totalLocks()).to.equal(1n);
    });

    it('Should emit Locked event with correct parameters', async function () {
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

      const hash = await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime,
      ]);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const lockedLog = receipt.logs.find(
        log => log.address.toLowerCase() === erc20Locker.address.toLowerCase()
      );
      expect(lockedLog).to.not.be.undefined;

      const decodedLog = decodeEventLog({
        abi: erc20LockerArtifact.abi,
        data: lockedLog!.data,
        topics: lockedLog!.topics,
        eventName: 'Locked',
      });

      expect(decodedLog.args.lockId).to.equal(0n);
      expect(decodedLog.args.owner.toLowerCase()).to.equal(
        addr1.account.address.toLowerCase()
      );
      expect(decodedLog.args.token.toLowerCase()).to.equal(
        erc20Token.address.toLowerCase()
      );
      expect(decodedLog.args.amount).to.equal(lockAmount);
      expect(decodedLog.args.endTime).to.equal(endTime);
    });

    it('Should transfer tokens from caller to contract', async function () {
      const { erc20Locker, erc20Token, owner, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      const initialOwnerBalance = await erc20Token.read.balanceOf([
        owner.account.address,
      ]);
      const initialContractBalance = await erc20Token.read.balanceOf([
        erc20Locker.address,
      ]);

      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        endTime,
      ]);

      const finalOwnerBalance = await erc20Token.read.balanceOf([
        owner.account.address,
      ]);
      const finalContractBalance = await erc20Token.read.balanceOf([
        erc20Locker.address,
      ]);

      expect(finalOwnerBalance).to.equal(initialOwnerBalance - lockAmount);
      expect(finalContractBalance).to.equal(
        initialContractBalance + lockAmount
      );
    });

    it('Should fail with zero address owner', async function () {
      const { erc20Locker, erc20Token } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      try {
        await erc20Locker.write.lock([
          '0x0000000000000000000000000000000000000000',
          erc20Token.address,
          lockAmount,
          endTime,
        ]);
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('InvalidOwner');
      }
    });

    it('Should fail with zero address token', async function () {
      const { erc20Locker, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      try {
        await erc20Locker.write.lock([
          addr1.account.address,
          '0x0000000000000000000000000000000000000000',
          lockAmount,
          endTime,
        ]);
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('InvalidTokenAddress');
      }
    });

    it('Should fail with zero amount', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      try {
        await erc20Locker.write.lock([
          addr1.account.address,
          erc20Token.address,
          0n,
          endTime,
        ]);
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('InvalidAmount');
      }
    });

    it('Should fail with past end time', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const pastEndTime = BigInt(currentTime - 3600);

      try {
        await erc20Locker.write.lock([
          addr1.account.address,
          erc20Token.address,
          lockAmount,
          pastEndTime,
        ]);
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('InvalidEndTime');
      }
    });

    it('Should fail with current timestamp as end time', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('100');
      const currentTime = await time.latest();
      const currentEndTime = BigInt(currentTime);

      try {
        await erc20Locker.write.lock([
          addr1.account.address,
          erc20Token.address,
          lockAmount,
          currentEndTime,
        ]);
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('InvalidEndTime');
      }
    });

    it('Should succeed with minimum valid endTime (current + 1)', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('100');

      // Get current time and add sufficient buffer to avoid timing issues
      const currentTime = await time.latest();
      const minValidEndTime = BigInt(currentTime + 2); // Use +2 for safety

      // This should succeed
      await erc20Locker.write.lock([
        addr1.account.address,
        erc20Token.address,
        lockAmount,
        minValidEndTime,
      ]);

      const [, , , storedEndTime] = await erc20Locker.read.locks([0n]);
      expect(storedEndTime).to.equal(minValidEndTime);

      // Verify withdrawal works at expiry
      await time.increaseTo(Number(minValidEndTime));

      const initialBalance = await erc20Token.read.balanceOf([
        addr1.account.address,
      ]);
      await erc20Locker.write.withdraw([0n], { account: addr1.account });
      const finalBalance = await erc20Token.read.balanceOf([
        addr1.account.address,
      ]);

      expect(finalBalance).to.equal(initialBalance + lockAmount);
    });

    it('Should fail with insufficient allowance', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const lockAmount = parseEther('10000'); // More than approved amount
      const currentTime = await time.latest();
      const endTime = BigInt(currentTime + 3600);

      try {
        await erc20Locker.write.lock([
          addr1.account.address,
          erc20Token.address,
          lockAmount,
          endTime,
        ]);
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('ERC20InsufficientAllowance');
      }
    });

    it('Should not increment totalLocks on failed lock creation', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const initialTotalLocks = await erc20Locker.read.totalLocks();

      try {
        await erc20Locker.write.lock([
          '0x0000000000000000000000000000000000000000', // Invalid owner
          erc20Token.address,
          parseEther('100'),
          BigInt((await time.latest()) + 3600),
        ]);
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('InvalidOwner');
      }

      const finalTotalLocks = await erc20Locker.read.totalLocks();
      expect(finalTotalLocks).to.equal(initialTotalLocks);
    });
  });

  describe('Multiple Lock Creation', function () {
    it('Should create multiple locks with correct details', async function () {
      const { erc20Locker, erc20Token, addr1, addr2 } = await loadFixture(
        deployERC20LockerFixture
      );

      const amounts = [parseEther('100'), parseEther('200')];
      const currentTime = await time.latest();
      const endTimes = [BigInt(currentTime + 3600), BigInt(currentTime + 7200)];
      const owners = [addr1.account.address, addr2.account.address];

      await erc20Locker.write.lockMultiple([
        erc20Token.address,
        owners,
        amounts,
        endTimes,
      ]);

      expect(await erc20Locker.read.totalLocks()).to.equal(2n);

      const [owner1, , amount1, endTime1] = await erc20Locker.read.locks([0n]);
      expect(owner1).to.equal(getAddress(addr1.account.address));
      expect(amount1).to.equal(amounts[0]);
      expect(endTime1).to.equal(endTimes[0]);

      const [owner2, , amount2, endTime2] = await erc20Locker.read.locks([1n]);
      expect(owner2).to.equal(getAddress(addr2.account.address));
      expect(amount2).to.equal(amounts[1]);
      expect(endTime2).to.equal(endTimes[1]);
    });

    it('Should emit multiple Locked events', async function () {
      const {
        erc20Locker,
        erc20LockerArtifact,
        erc20Token,
        addr1,
        addr2,
        publicClient,
      } = await loadFixture(deployERC20LockerFixture);

      const amounts = [parseEther('100'), parseEther('200')];
      const currentTime = await time.latest();
      const endTimes = [BigInt(currentTime + 3600), BigInt(currentTime + 7200)];
      const owners = [addr1.account.address, addr2.account.address];

      const hash = await erc20Locker.write.lockMultiple([
        erc20Token.address,
        owners,
        amounts,
        endTimes,
      ]);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const lockedLogs = receipt.logs.filter(
        log => log.address.toLowerCase() === erc20Locker.address.toLowerCase()
      );
      expect(lockedLogs).to.have.length(2);

      for (let i = 0; i < 2; i++) {
        const decodedLog = decodeEventLog({
          abi: erc20LockerArtifact.abi,
          data: lockedLogs[i].data,
          topics: lockedLogs[i].topics,
          eventName: 'Locked',
        });

        expect(decodedLog.args.lockId).to.equal(BigInt(i));
        expect(decodedLog.args.owner.toLowerCase()).to.equal(
          owners[i].toLowerCase()
        );
        expect(decodedLog.args.amount).to.equal(amounts[i]);
        expect(decodedLog.args.endTime).to.equal(endTimes[i]);
      }
    });

    it('Should transfer correct total amount', async function () {
      const { erc20Locker, erc20Token, owner, addr1, addr2 } =
        await loadFixture(deployERC20LockerFixture);

      const amounts = [parseEther('100'), parseEther('200')];
      const totalAmount = amounts[0] + amounts[1];
      const currentTime = await time.latest();
      const endTimes = [BigInt(currentTime + 3600), BigInt(currentTime + 7200)];
      const owners = [addr1.account.address, addr2.account.address];

      const initialOwnerBalance = await erc20Token.read.balanceOf([
        owner.account.address,
      ]);

      await erc20Locker.write.lockMultiple([
        erc20Token.address,
        owners,
        amounts,
        endTimes,
      ]);

      const finalOwnerBalance = await erc20Token.read.balanceOf([
        owner.account.address,
      ]);

      expect(finalOwnerBalance).to.equal(initialOwnerBalance - totalAmount);
    });

    it('Should fail with mismatched array lengths - owners and amounts', async function () {
      const { erc20Locker, erc20Token, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      const amounts = [parseEther('100'), parseEther('200')];
      const currentTime = await time.latest();
      const endTimes = [BigInt(currentTime + 3600), BigInt(currentTime + 7200)];
      const owners = [addr1.account.address]; // Mismatched length

      try {
        await erc20Locker.write.lockMultiple([
          erc20Token.address,
          owners,
          amounts,
          endTimes,
        ]);
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('MismatchedArrays');
      }
    });

    it('Should fail with mismatched array lengths - owners and endTimes', async function () {
      const { erc20Locker, erc20Token, addr1, addr2 } = await loadFixture(
        deployERC20LockerFixture
      );

      const amounts = [parseEther('100'), parseEther('200')];
      const currentTime = await time.latest();
      const endTimes = [BigInt(currentTime + 3600)]; // Mismatched length
      const owners = [addr1.account.address, addr2.account.address];

      try {
        await erc20Locker.write.lockMultiple([
          erc20Token.address,
          owners,
          amounts,
          endTimes,
        ]);
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('MismatchedArrays');
      }
    });

    it('Should fail with zero total amount', async function () {
      const { erc20Locker, erc20Token, addr1, addr2 } = await loadFixture(
        deployERC20LockerFixture
      );

      const amounts = [0n, 0n];
      const currentTime = await time.latest();
      const endTimes = [BigInt(currentTime + 3600), BigInt(currentTime + 7200)];
      const owners = [addr1.account.address, addr2.account.address];

      try {
        await erc20Locker.write.lockMultiple([
          erc20Token.address,
          owners,
          amounts,
          endTimes,
        ]);
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('InvalidAmount');
      }
    });

    it('Should fail with empty arrays', async function () {
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

    it('Should handle large arrays efficiently', async function () {
      const { erc20Locker, erc20Token, owner, addr1 } = await loadFixture(
        deployERC20LockerFixture
      );

      // Create arrays with 50 recipients
      const owners = Array(50).fill(addr1.account.address);
      const amounts = Array(50).fill(parseEther('10'));
      const currentTime = await time.latest();
      const endTimes = Array(50).fill(BigInt(currentTime + 3600));

      const totalAmount = parseEther('500'); // 50 * 10

      // Need additional approval for large amount
      await erc20Token.write.approve([erc20Locker.address, totalAmount]);

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
      expect(await erc20Locker.read.totalLocks()).to.equal(50n);
    });
  });
});
