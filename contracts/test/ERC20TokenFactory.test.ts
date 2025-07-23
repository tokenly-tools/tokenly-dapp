import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import hre from 'hardhat';
import {
  parseEther,
  zeroAddress,
  isAddress,
  decodeEventLog,
  maxUint256,
} from 'viem';

describe('ERC20TokenFactory', function () {
  async function deployERC20TokenFactoryFixture() {
    const [owner, addr1, addr2] = await hre.viem.getWalletClients();

    const factory = await hre.viem.deployContract('ERC20TokenFactory', []);

    const publicClient = await hre.viem.getPublicClient();
    const factoryArtifact =
      await hre.artifacts.readArtifact('ERC20TokenFactory');

    return {
      factory,
      factoryArtifact,
      owner,
      addr1,
      addr2,
      publicClient,
    };
  }

  describe('Deployment', function () {
    it('Should deploy successfully', async function () {
      const { factory } = await loadFixture(deployERC20TokenFactoryFixture);

      expect(isAddress(factory.address)).to.be.true;
    });
  });

  describe('Token Creation', function () {
    it('Should create a new ERC20 token with correct parameters', async function () {
      const { factory, addr1 } = await loadFixture(
        deployERC20TokenFactoryFixture
      );

      const tokenName = 'Test Token';
      const tokenSymbol = 'TEST';
      const initialSupply = parseEther('1000');

      const hash = await factory.write.createToken([
        tokenName,
        tokenSymbol,
        addr1.account.address,
        initialSupply,
      ]);

      expect(hash).to.match(/^0x[a-fA-F0-9]{64}$/);
    });

    it('Should create token with zero initial supply', async function () {
      const { factory, addr1 } = await loadFixture(
        deployERC20TokenFactoryFixture
      );

      const hash = await factory.write.createToken([
        'Zero Token',
        'ZERO',
        addr1.account.address,
        0n,
      ]);

      expect(hash).to.match(/^0x[a-fA-F0-9]{64}$/);
    });

    it('Should create multiple tokens with different parameters', async function () {
      const { factory, addr1, addr2 } = await loadFixture(
        deployERC20TokenFactoryFixture
      );

      const hash1 = await factory.write.createToken([
        'Token One',
        'ONE',
        addr1.account.address,
        parseEther('100'),
      ]);

      const hash2 = await factory.write.createToken([
        'Token Two',
        'TWO',
        addr2.account.address,
        parseEther('200'),
      ]);

      expect(hash1).to.match(/^0x[a-fA-F0-9]{64}$/);
      expect(hash2).to.match(/^0x[a-fA-F0-9]{64}$/);
      expect(hash1).to.not.equal(hash2);
    });

    it('Should create token with very long name and symbol', async function () {
      const { factory, addr1 } = await loadFixture(
        deployERC20TokenFactoryFixture
      );

      const longName = 'A'.repeat(100);
      const longSymbol = 'B'.repeat(50);

      const hash = await factory.write.createToken([
        longName,
        longSymbol,
        addr1.account.address,
        parseEther('1'),
      ]);

      expect(hash).to.match(/^0x[a-fA-F0-9]{64}$/);
    });

    it('Should create token with large supply', async function () {
      const { factory, addr1 } = await loadFixture(
        deployERC20TokenFactoryFixture
      );

      const largeSupply = parseEther('1000000'); // 1 million tokens

      const hash = await factory.write.createToken([
        'Large Supply Token',
        'LARGE',
        addr1.account.address,
        largeSupply,
      ]);

      expect(hash).to.match(/^0x[a-fA-F0-9]{64}$/);
    });

    it('Should create a token with max initial supply', async function () {
      const { factory, addr1 } = await loadFixture(
        deployERC20TokenFactoryFixture
      );

      const hash = await factory.write.createToken([
        'Max Supply Token',
        'MAX',
        addr1.account.address,
        maxUint256,
      ]);

      expect(hash).to.match(/^0x[a-fA-F0-9]{64}$/);
    });
  });

  describe('Created Token Verification', function () {
    it('Should create token with correct name, symbol, and initial holder', async function () {
      const { factory, factoryArtifact, addr1, publicClient } =
        await loadFixture(deployERC20TokenFactoryFixture);

      const tokenName = 'Test Token';
      const tokenSymbol = 'TEST';
      const initialSupply = parseEther('1000');

      // Create token and get transaction hash
      const hash = await factory.write.createToken([
        tokenName,
        tokenSymbol,
        addr1.account.address,
        initialSupply,
      ]);

      // Wait for transaction and get receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const tokenCreatedLog = receipt.logs.find(
        log => log.address.toLowerCase() === factory.address.toLowerCase()
      );
      expect(tokenCreatedLog).to.not.be.undefined;

      const decodedLog = decodeEventLog({
        abi: factoryArtifact.abi,
        data: tokenCreatedLog!.data,
        topics: tokenCreatedLog!.topics,
        eventName: 'TokenCreated',
      });

      const tokenAddress = decodedLog.args.tokenAddress;
      expect(isAddress(tokenAddress)).to.be.true;

      const token = await hre.viem.getContractAt('ERC20Token', tokenAddress);

      expect(await token.read.name()).to.equal(tokenName);
      expect(await token.read.symbol()).to.equal(tokenSymbol);
      expect(await token.read.totalSupply()).to.equal(initialSupply);
      expect(await token.read.balanceOf([addr1.account.address])).to.equal(
        initialSupply
      );
    });

    it('Should mint initial supply to the specified initial holder', async function () {
      const { factory, factoryArtifact, addr1, addr2, publicClient } =
        await loadFixture(deployERC20TokenFactoryFixture);

      const initialSupply = parseEther('500');

      const hash = await factory.write.createToken([
        'Holder Test',
        'HOLD',
        addr2.account.address, // addr2 as initial holder
        initialSupply,
      ]);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const tokenCreatedLog = receipt.logs.find(
        log => log.address.toLowerCase() === factory.address.toLowerCase()
      );
      expect(tokenCreatedLog).to.not.be.undefined;

      const decodedLog = decodeEventLog({
        abi: factoryArtifact.abi,
        data: tokenCreatedLog!.data,
        topics: tokenCreatedLog!.topics,
        eventName: 'TokenCreated',
      });

      const tokenAddress = decodedLog.args.tokenAddress;
      const token = await hre.viem.getContractAt('ERC20Token', tokenAddress);

      // addr2 should have the initial supply
      expect(await token.read.balanceOf([addr2.account.address])).to.equal(
        initialSupply
      );
      // addr1 should have zero
      expect(await token.read.balanceOf([addr1.account.address])).to.equal(0n);
    });

    it('Should create a fully functional ERC20 token', async function () {
      const { factory, factoryArtifact, addr1, addr2, publicClient } =
        await loadFixture(deployERC20TokenFactoryFixture);

      const initialSupply = parseEther('1000');

      const hash = await factory.write.createToken([
        'Functional Token',
        'FUNC',
        addr1.account.address,
        initialSupply,
      ]);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const tokenCreatedLog = receipt.logs.find(
        log => log.address.toLowerCase() === factory.address.toLowerCase()
      );
      expect(tokenCreatedLog).to.not.be.undefined;

      const decodedLog = decodeEventLog({
        abi: factoryArtifact.abi,
        data: tokenCreatedLog!.data,
        topics: tokenCreatedLog!.topics,
        eventName: 'TokenCreated',
      });

      const tokenAddress = decodedLog.args.tokenAddress;
      const token = await hre.viem.getContractAt('ERC20Token', tokenAddress);

      // Test transfer
      const transferAmount = parseEther('100');
      await token.write.transfer([addr2.account.address, transferAmount], {
        account: addr1.account,
      });
      expect(await token.read.balanceOf([addr2.account.address])).to.equal(
        transferAmount
      );

      // Test approve and transferFrom
      const approveAmount = parseEther('50');
      await token.write.approve([addr2.account.address, approveAmount], {
        account: addr1.account,
      });
      expect(
        await token.read.allowance([
          addr1.account.address,
          addr2.account.address,
        ])
      ).to.equal(approveAmount);
    });
  });

  describe('Events', function () {
    it('Should emit TokenCreated event with correct parameters', async function () {
      const { factory, factoryArtifact, owner, addr1, publicClient } =
        await loadFixture(deployERC20TokenFactoryFixture);

      const tokenName = 'Event Test';
      const tokenSymbol = 'EVENT';
      const initialSupply = parseEther('750');

      const hash = await factory.write.createToken([
        tokenName,
        tokenSymbol,
        addr1.account.address,
        initialSupply,
      ]);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const tokenCreatedLog = receipt.logs.find(
        log => log.address.toLowerCase() === factory.address.toLowerCase()
      );

      expect(tokenCreatedLog).to.not.be.undefined;

      const decodedLog = decodeEventLog({
        abi: factoryArtifact.abi,
        data: tokenCreatedLog!.data,
        topics: tokenCreatedLog!.topics,
        eventName: 'TokenCreated',
      });

      expect(isAddress(decodedLog.args.tokenAddress)).to.be.true;
      expect(decodedLog.args.name).to.equal(tokenName);
      expect(decodedLog.args.symbol).to.equal(tokenSymbol);
      expect(decodedLog.args.initialHolder.toLowerCase()).to.equal(
        addr1.account.address.toLowerCase()
      );
      expect(decodedLog.args.initialSupply).to.equal(initialSupply);
      expect(decodedLog.args.creator.toLowerCase()).to.equal(
        owner.account.address.toLowerCase()
      );
    });
  });

  describe('Error Cases', function () {
    it('Should revert when name is empty', async function () {
      const { factory, addr1 } = await loadFixture(
        deployERC20TokenFactoryFixture
      );

      try {
        await factory.write.createToken([
          '', // Empty name
          'TEST',
          addr1.account.address,
          parseEther('100'),
        ]);
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('EmptyName');
      }
    });

    it('Should revert when symbol is empty', async function () {
      const { factory, addr1 } = await loadFixture(
        deployERC20TokenFactoryFixture
      );

      try {
        await factory.write.createToken([
          'Test Token',
          '', // Empty symbol
          addr1.account.address,
          parseEther('100'),
        ]);
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('EmptySymbol');
      }
    });

    it('Should revert when initial holder is zero address', async function () {
      const { factory } = await loadFixture(deployERC20TokenFactoryFixture);

      try {
        await factory.write.createToken([
          'Test Token',
          'TEST',
          zeroAddress, // Zero address
          parseEther('100'),
        ]);
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('InvalidInitialHolder');
      }
    });

    it('Should revert when both name and symbol are empty', async function () {
      const { factory, addr1 } = await loadFixture(
        deployERC20TokenFactoryFixture
      );

      try {
        await factory.write.createToken([
          '', // Empty name
          '', // Empty symbol
          addr1.account.address,
          parseEther('100'),
        ]);
        expect.fail('Expected transaction to revert');
      } catch (error: any) {
        expect(error.message).to.include('EmptyName');
      }
    });
  });

  describe('Edge Cases', function () {
    it('Should handle creation from different accounts', async function () {
      const { factory, owner, addr1, addr2 } = await loadFixture(
        deployERC20TokenFactoryFixture
      );

      // Create token from owner account
      const hash1 = await factory.write.createToken([
        'Owner Token',
        'OWN',
        addr1.account.address,
        parseEther('100'),
      ]);

      // Create token from addr1 account
      const hash2 = await factory.write.createToken(
        ['Addr1 Token', 'ADDR1', addr2.account.address, parseEther('200')],
        { account: addr1.account }
      );

      expect(hash1).to.match(/^0x[a-fA-F0-9]{64}$/);
      expect(hash2).to.match(/^0x[a-fA-F0-9]{64}$/);
      expect(hash1).to.not.equal(hash2);
    });

    it('Should handle creation with same name but different symbols', async function () {
      const { factory, addr1 } = await loadFixture(
        deployERC20TokenFactoryFixture
      );

      const hash1 = await factory.write.createToken([
        'Same Name',
        'SYM1',
        addr1.account.address,
        parseEther('100'),
      ]);

      const hash2 = await factory.write.createToken([
        'Same Name',
        'SYM2',
        addr1.account.address,
        parseEther('100'),
      ]);

      expect(hash1).to.match(/^0x[a-fA-F0-9]{64}$/);
      expect(hash2).to.match(/^0x[a-fA-F0-9]{64}$/);
      expect(hash1).to.not.equal(hash2);
    });

    it('Should handle creation with same symbol but different names', async function () {
      const { factory, addr1 } = await loadFixture(
        deployERC20TokenFactoryFixture
      );

      const hash1 = await factory.write.createToken([
        'Name One',
        'SAME',
        addr1.account.address,
        parseEther('100'),
      ]);

      const hash2 = await factory.write.createToken([
        'Name Two',
        'SAME',
        addr1.account.address,
        parseEther('100'),
      ]);

      expect(hash1).to.match(/^0x[a-fA-F0-9]{64}$/);
      expect(hash2).to.match(/^0x[a-fA-F0-9]{64}$/);
      expect(hash1).to.not.equal(hash2);
    });

    it('Should handle creation with single character name and symbol', async function () {
      const { factory, addr1 } = await loadFixture(
        deployERC20TokenFactoryFixture
      );

      const hash = await factory.write.createToken([
        'A',
        'B',
        addr1.account.address,
        parseEther('1'),
      ]);

      expect(hash).to.match(/^0x[a-fA-F0-9]{64}$/);
    });
  });
});
