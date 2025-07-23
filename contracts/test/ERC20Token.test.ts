import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';
import { parseEther, decodeEventLog, maxUint256 } from 'viem';

describe('ERC20Token', function () {
  async function deployERC20TokenFixture() {
    const [owner, addr1, addr2] = await hre.viem.getWalletClients();

    const erc20Token = await hre.viem.deployContract('ERC20Token', [
      'Test Token',
      'TEST',
      owner.account.address,
      parseEther('1000'),
    ]);

    const publicClient = await hre.viem.getPublicClient();
    const erc20TokenArtifact = await hre.artifacts.readArtifact('ERC20Token');

    return {
      erc20Token,
      erc20TokenArtifact,
      owner,
      addr1,
      addr2,
      publicClient,
    };
  }

  async function deployTokenWithCustomParams() {
    const [owner, initialHolder] = await hre.viem.getWalletClients();

    const erc20Token = await hre.viem.deployContract('ERC20Token', [
      'Custom Token',
      'CUSTOM',
      initialHolder.account.address,
      parseEther('500'),
    ]);

    const publicClient = await hre.viem.getPublicClient();

    return {
      erc20Token,
      owner,
      initialHolder,
      publicClient,
    };
  }

  describe('Deployment', function () {
    it('Should set the correct name and symbol', async function () {
      const { erc20Token } = await loadFixture(deployERC20TokenFixture);

      expect(await erc20Token.read.name()).to.equal('Test Token');
      expect(await erc20Token.read.symbol()).to.equal('TEST');
    });

    it('Should set the correct decimals (default 18)', async function () {
      const { erc20Token } = await loadFixture(deployERC20TokenFixture);

      expect(await erc20Token.read.decimals()).to.equal(18);
    });

    it('Should mint initial supply to the initial holder', async function () {
      const { erc20Token, owner } = await loadFixture(deployERC20TokenFixture);

      const ownerBalance = await erc20Token.read.balanceOf([
        owner.account.address,
      ]);
      expect(ownerBalance).to.equal(parseEther('1000'));
    });

    it('Should set the total supply correctly', async function () {
      const { erc20Token } = await loadFixture(deployERC20TokenFixture);

      const totalSupply = await erc20Token.read.totalSupply();
      expect(totalSupply).to.equal(parseEther('1000'));
    });

    it('Should mint tokens to a different initial holder', async function () {
      const { erc20Token, initialHolder } = await loadFixture(
        deployTokenWithCustomParams
      );

      const holderBalance = await erc20Token.read.balanceOf([
        initialHolder.account.address,
      ]);
      expect(holderBalance).to.equal(parseEther('500'));
    });

    it('Should deploy with zero initial supply', async function () {
      const [owner] = await hre.viem.getWalletClients();

      const erc20Token = await hre.viem.deployContract('ERC20Token', [
        'Zero Token',
        'ZERO',
        owner.account.address,
        0n,
      ]);

      expect(await erc20Token.read.totalSupply()).to.equal(0n);
      expect(await erc20Token.read.balanceOf([owner.account.address])).to.equal(
        0n
      );
    });
  });

  describe('ERC20 Functionality', function () {
    it('Should transfer tokens between accounts', async function () {
      const { erc20Token, owner, addr1 } = await loadFixture(
        deployERC20TokenFixture
      );

      const transferAmount = parseEther('100');

      await erc20Token.write.transfer([addr1.account.address, transferAmount]);

      const ownerBalance = await erc20Token.read.balanceOf([
        owner.account.address,
      ]);
      const addr1Balance = await erc20Token.read.balanceOf([
        addr1.account.address,
      ]);

      expect(ownerBalance).to.equal(parseEther('900'));
      expect(addr1Balance).to.equal(transferAmount);
    });

    it('Should fail if sender does not have enough tokens', async function () {
      const { erc20Token, addr1, addr2 } = await loadFixture(
        deployERC20TokenFixture
      );

      const transferAmount = parseEther('1');

      try {
        await erc20Token.write.transfer(
          [addr2.account.address, transferAmount],
          {
            account: addr1.account,
          }
        );
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('ERC20InsufficientBalance');
      }
    });

    it('Should update allowances on approve', async function () {
      const { erc20Token, owner, addr1 } = await loadFixture(
        deployERC20TokenFixture
      );

      const approveAmount = parseEther('100');

      await erc20Token.write.approve([addr1.account.address, approveAmount]);

      const allowance = await erc20Token.read.allowance([
        owner.account.address,
        addr1.account.address,
      ]);
      expect(allowance).to.equal(approveAmount);
    });

    it('Should transfer from with approval', async function () {
      const { erc20Token, owner, addr1, addr2 } = await loadFixture(
        deployERC20TokenFixture
      );

      const approveAmount = parseEther('100');
      const transferAmount = parseEther('50');

      // Owner approves addr1 to spend tokens
      await erc20Token.write.approve([addr1.account.address, approveAmount]);

      // addr1 transfers from owner to addr2
      await erc20Token.write.transferFrom(
        [owner.account.address, addr2.account.address, transferAmount],
        {
          account: addr1.account,
        }
      );

      const ownerBalance = await erc20Token.read.balanceOf([
        owner.account.address,
      ]);
      const addr2Balance = await erc20Token.read.balanceOf([
        addr2.account.address,
      ]);
      const remainingAllowance = await erc20Token.read.allowance([
        owner.account.address,
        addr1.account.address,
      ]);

      expect(ownerBalance).to.equal(parseEther('950'));
      expect(addr2Balance).to.equal(transferAmount);
      expect(remainingAllowance).to.equal(parseEther('50'));
    });

    it('Should fail transferFrom without approval', async function () {
      const { erc20Token, owner, addr1, addr2 } = await loadFixture(
        deployERC20TokenFixture
      );

      const transferAmount = parseEther('50');

      try {
        await erc20Token.write.transferFrom(
          [owner.account.address, addr2.account.address, transferAmount],
          {
            account: addr1.account,
          }
        );
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('ERC20InsufficientAllowance');
      }
    });

    it('Should fail transferFrom with insufficient allowance', async function () {
      const { erc20Token, owner, addr1, addr2 } = await loadFixture(
        deployERC20TokenFixture
      );

      const approveAmount = parseEther('50');
      const transferAmount = parseEther('100');

      await erc20Token.write.approve([addr1.account.address, approveAmount]);

      try {
        await erc20Token.write.transferFrom(
          [owner.account.address, addr2.account.address, transferAmount],
          {
            account: addr1.account,
          }
        );
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('ERC20InsufficientAllowance');
      }
    });

    it('Should fail transferFrom if allowance is exact and then exceeded', async function () {
      const { erc20Token, owner, addr1, addr2 } = await loadFixture(
        deployERC20TokenFixture
      );

      const approveAmount = parseEther('50');

      await erc20Token.write.approve([addr1.account.address, approveAmount]);

      await erc20Token.write.transferFrom(
        [owner.account.address, addr2.account.address, approveAmount],
        {
          account: addr1.account,
        }
      );

      const remainingAllowance = await erc20Token.read.allowance([
        owner.account.address,
        addr1.account.address,
      ]);
      expect(remainingAllowance).to.equal(0n);

      try {
        await erc20Token.write.transferFrom(
          [owner.account.address, addr2.account.address, 1n],
          {
            account: addr1.account,
          }
        );
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('ERC20InsufficientAllowance');
      }
    });
  });

  describe('Events', function () {
    it('Should emit Transfer event on token transfer', async function () {
      const { erc20Token, erc20TokenArtifact, owner, addr1, publicClient } =
        await loadFixture(deployERC20TokenFixture);

      const transferAmount = parseEther('100');

      const hash = await erc20Token.write.transfer([
        addr1.account.address,
        transferAmount,
      ]);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const transferLog = receipt.logs.find(
        log => log.address.toLowerCase() === erc20Token.address.toLowerCase()
      );
      expect(transferLog).to.not.be.undefined;

      const decodedLog = decodeEventLog({
        abi: erc20TokenArtifact.abi,
        data: transferLog!.data,
        topics: transferLog!.topics,
        eventName: 'Transfer',
      });

      expect(decodedLog.args.from.toLowerCase()).to.equal(
        owner.account.address.toLowerCase()
      );
      expect(decodedLog.args.to.toLowerCase()).to.equal(
        addr1.account.address.toLowerCase()
      );
      expect(decodedLog.args.value).to.equal(transferAmount);
    });

    it('Should emit Approval event on approve', async function () {
      const { erc20Token, erc20TokenArtifact, owner, addr1, publicClient } =
        await loadFixture(deployERC20TokenFixture);

      const approveAmount = parseEther('100');

      const hash = await erc20Token.write.approve([
        addr1.account.address,
        approveAmount,
      ]);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const approvalLog = receipt.logs.find(
        log => log.address.toLowerCase() === erc20Token.address.toLowerCase()
      );
      expect(approvalLog).to.not.be.undefined;

      const decodedLog = decodeEventLog({
        abi: erc20TokenArtifact.abi,
        data: approvalLog!.data,
        topics: approvalLog!.topics,
        eventName: 'Approval',
      });

      expect(decodedLog.args.owner.toLowerCase()).to.equal(
        owner.account.address.toLowerCase()
      );
      expect(decodedLog.args.spender.toLowerCase()).to.equal(
        addr1.account.address.toLowerCase()
      );
      expect(decodedLog.args.value).to.equal(approveAmount);
    });
  });

  describe('Edge Cases', function () {
    it('Should handle transfer to self', async function () {
      const { erc20Token, owner } = await loadFixture(deployERC20TokenFixture);

      const transferAmount = parseEther('100');
      const initialBalance = await erc20Token.read.balanceOf([
        owner.account.address,
      ]);

      await erc20Token.write.transfer([owner.account.address, transferAmount]);

      const finalBalance = await erc20Token.read.balanceOf([
        owner.account.address,
      ]);
      expect(finalBalance).to.equal(initialBalance);
    });

    it('Should handle zero amount transfers', async function () {
      const { erc20Token, owner, addr1 } = await loadFixture(
        deployERC20TokenFixture
      );

      const initialOwnerBalance = await erc20Token.read.balanceOf([
        owner.account.address,
      ]);
      const initialAddr1Balance = await erc20Token.read.balanceOf([
        addr1.account.address,
      ]);

      await erc20Token.write.transfer([addr1.account.address, 0n]);

      const finalOwnerBalance = await erc20Token.read.balanceOf([
        owner.account.address,
      ]);
      const finalAddr1Balance = await erc20Token.read.balanceOf([
        addr1.account.address,
      ]);

      expect(finalOwnerBalance).to.equal(initialOwnerBalance);
      expect(finalAddr1Balance).to.equal(initialAddr1Balance);
    });

    it('Should handle approve with zero amount', async function () {
      const { erc20Token, owner, addr1 } = await loadFixture(
        deployERC20TokenFixture
      );

      await erc20Token.write.approve([addr1.account.address, 0n]);

      const allowance = await erc20Token.read.allowance([
        owner.account.address,
        addr1.account.address,
      ]);
      expect(allowance).to.equal(0n);
    });

    it('Should handle approving max uint256', async function () {
      const { erc20Token, owner, addr1 } = await loadFixture(
        deployERC20TokenFixture
      );

      await erc20Token.write.approve([addr1.account.address, maxUint256]);

      const allowance = await erc20Token.read.allowance([
        owner.account.address,
        addr1.account.address,
      ]);
      expect(allowance).to.equal(maxUint256);
    });
  });
});
