import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'
import { parseEther } from 'viem'

describe('Multisender', function () {
  async function deployContracts() {
    const [owner, recipient1, recipient2, recipient3] = await hre.viem.getWalletClients()

    const multisender = await hre.viem.deployContract('Multisender')
    const erc20Token = await hre.viem.deployContract('ERC20Token', [
      'Test Token',
      'TST',
      owner.account.address,
      parseEther('1000')
    ])
    const ethRejecter = await hre.viem.deployContract('EthRejecter')

    const publicClient = await hre.viem.getPublicClient()

    return {
      multisender,
      erc20Token,
      ethRejecter,
      owner,
      recipient1,
      recipient2,
      recipient3,
      publicClient
    }
  }

  describe('multisendNative', function () {
    it('should send ETH to multiple recipients', async function () {
      const { multisender, recipient1, recipient2, recipient3, publicClient } = await loadFixture(deployContracts)

      const initialBalances = {
        recipient1: await publicClient.getBalance({
          address: recipient1.account.address
        }),
        recipient2: await publicClient.getBalance({
          address: recipient2.account.address
        }),
        recipient3: await publicClient.getBalance({
          address: recipient3.account.address
        })
      }

      const amounts = [parseEther('1'), parseEther('2.5'), parseEther('0.5')]
      const totalAmount = amounts.reduce((acc, val) => acc + val, 0n)

      await multisender.write.multisendNative(
        [[recipient1.account.address, recipient2.account.address, recipient3.account.address], amounts],
        { value: totalAmount }
      )

      const finalBalances = {
        recipient1: await publicClient.getBalance({
          address: recipient1.account.address
        }),
        recipient2: await publicClient.getBalance({
          address: recipient2.account.address
        }),
        recipient3: await publicClient.getBalance({
          address: recipient3.account.address
        })
      }

      expect(finalBalances.recipient1).to.equal(initialBalances.recipient1 + amounts[0])
      expect(finalBalances.recipient2).to.equal(initialBalances.recipient2 + amounts[1])
      expect(finalBalances.recipient3).to.equal(initialBalances.recipient3 + amounts[2])
    })

    it('should revert if no recipients are provided', async function () {
      const { multisender } = await loadFixture(deployContracts)
      const totalAmount = parseEther('1')

      try {
        await multisender.write.multisendNative([[], []], {
          value: totalAmount
        })
        expect.fail('Expected transaction to revert')
      } catch (error: any) {
        expect(error.message).to.include('NoRecipientsProvided')
      }
    })

    it('should revert if recipients and amounts length mismatch', async function () {
      const { multisender, recipient1 } = await loadFixture(deployContracts)
      const totalAmount = parseEther('1')

      try {
        await multisender.write.multisendNative([[recipient1.account.address], []], { value: totalAmount })
        expect.fail('Expected transaction to revert')
      } catch (error: any) {
        expect(error.message).to.include('RecipientsAndAmountsLengthMismatch')
      }
    })

    it('should revert if incorrect total amount is sent', async function () {
      const { multisender, recipient1 } = await loadFixture(deployContracts)
      const amounts = [parseEther('1')]
      const incorrectTotalAmount = parseEther('0.5')

      try {
        await multisender.write.multisendNative([[recipient1.account.address], amounts], {
          value: incorrectTotalAmount
        })
        expect.fail('Expected transaction to revert')
      } catch (error: any) {
        expect(error.message).to.include('IncorrectTotalAmountSent')
      }
    })

    it('should revert if ETH transfer fails (contract rejects ETH)', async function () {
      const { multisender, ethRejecter } = await loadFixture(deployContracts)
      const amounts = [parseEther('1')]
      const totalAmount = amounts[0]

      try {
        await multisender.write.multisendNative([[ethRejecter.address], amounts], { value: totalAmount })
        expect.fail('Expected transaction to revert')
      } catch (error: any) {
        expect(error.message).to.include('FailedToSendETH')
      }
    })
  })

  describe('multisendToken', function () {
    it('should send ERC20 tokens to multiple recipients', async function () {
      const { multisender, erc20Token, owner, recipient1, recipient2 } = await loadFixture(deployContracts)

      const amounts = [parseEther('10'), parseEther('20')]
      const totalAmount = amounts.reduce((acc, val) => acc + val, 0n)
      const recipients = [recipient1.account.address, recipient2.account.address]

      await erc20Token.write.approve([multisender.address, totalAmount], {
        account: owner.account
      })

      await multisender.write.multisendToken([erc20Token.address, recipients, amounts], { account: owner.account })

      const recipient1Balance = await erc20Token.read.balanceOf([recipient1.account.address])
      const recipient2Balance = await erc20Token.read.balanceOf([recipient2.account.address])

      expect(recipient1Balance).to.equal(amounts[0])
      expect(recipient2Balance).to.equal(amounts[1])
    })

    it('should revert if no recipients are provided', async function () {
      const { multisender, erc20Token, owner } = await loadFixture(deployContracts)

      try {
        await multisender.write.multisendToken([erc20Token.address, [], []], {
          account: owner.account
        })
        expect.fail('Expected transaction to revert')
      } catch (error: any) {
        expect(error.message).to.include('NoRecipientsProvided')
      }
    })

    it('should revert if recipients and amounts length mismatch', async function () {
      const { multisender, erc20Token, owner, recipient1 } = await loadFixture(deployContracts)

      try {
        await multisender.write.multisendToken([erc20Token.address, [recipient1.account.address], []], {
          account: owner.account
        })
        expect.fail('Expected transaction to revert')
      } catch (error: any) {
        expect(error.message).to.include('RecipientsAndAmountsLengthMismatch')
      }
    })

    it('should revert if token transfer fails', async function () {
      const { multisender, erc20Token, owner, recipient1 } = await loadFixture(deployContracts)
      const amounts = [parseEther('1001')] // Insufficient balance
      const recipients = [recipient1.account.address]

      await erc20Token.write.approve([multisender.address, amounts[0]], {
        account: owner.account
      })

      try {
        await multisender.write.multisendToken([erc20Token.address, recipients, amounts], { account: owner.account })
        expect.fail('Expected transaction to revert')
      } catch (error: any) {
        expect(error.message).to.include('ERC20InsufficientBalance')
      }
    })
  })
})
