import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'
import { parseEther, getAddress } from 'viem'

describe('LockerReader', function () {
  async function deployFixture() {
    const [owner, addr1, addr2] = await hre.viem.getWalletClients()

    const erc20Token = await hre.viem.deployContract('ERC20Token', [
      'Test Token',
      'TEST',
      owner.account.address,
      parseEther('10000')
    ])

    const erc20Locker = await hre.viem.deployContract('ERC20Locker')
    const lockerReader = await hre.viem.deployContract('LockerReader', [erc20Locker.address])

    await erc20Token.write.approve([erc20Locker.address, parseEther('5000')])

    const publicClient = await hre.viem.getPublicClient()

    return { erc20Token, erc20Locker, lockerReader, owner, addr1, addr2, publicClient }
  }

  it('getLock should return lock details with token metadata (including when owner is zero)', async function () {
    const { erc20Token, erc20Locker, lockerReader, addr1 } = await loadFixture(deployFixture)

    const lockAmount = parseEther('100')
    const endTime = BigInt((await time.latest()) + 3600)

    await erc20Locker.write.lock([addr1.account.address, erc20Token.address, lockAmount, endTime])

    // Renounce ownership so owner becomes zero address but amount remains > 0
    await erc20Locker.write.renounceLockOwnership([0n], { account: addr1.account })

    const viewData = (await lockerReader.read.getLock([0n])) as unknown as {
      lockId: bigint
      owner: string
      token: string
      amount: bigint
      endTime: bigint
      tokenName: string
      tokenSymbol: string
      tokenDecimals: number
    }

    expect(viewData.lockId).to.equal(0n)
    expect(viewData.owner).to.equal(getAddress('0x0000000000000000000000000000000000000000'))
    expect(viewData.token).to.equal(getAddress(erc20Token.address))
    expect(viewData.amount).to.equal(lockAmount)
    expect(viewData.endTime).to.equal(endTime)
    expect(viewData.tokenName).to.equal('Test Token')
    expect(viewData.tokenSymbol).to.equal('TEST')
    expect(viewData.tokenDecimals).to.equal(18)
  })

  it('getAllLocks should include renounced-owner locks and exclude withdrawn (amount == 0)', async function () {
    const { erc20Token, erc20Locker, lockerReader, owner, addr1, addr2 } = await loadFixture(deployFixture)

    const now = await time.latest()
    const endTime1 = BigInt(now + 3600)
    const endTime2 = BigInt(now + 7200)

    // Create two locks
    await erc20Locker.write.lock([addr1.account.address, erc20Token.address, parseEther('100'), endTime1])

    await erc20Locker.write.lock([addr2.account.address, erc20Token.address, parseEther('200'), endTime2])

    // Renounce first lock ownership (owner -> zero)
    await erc20Locker.write.renounceLockOwnership([0n], { account: addr1.account })

    // All locks should be returned (2), including renounced owner
    const allBefore = (await lockerReader.read.getAllLocks()) as unknown as Array<{
      lockId: bigint
      owner: string
      token: string
      amount: bigint
      endTime: bigint
      tokenName: string
      tokenSymbol: string
      tokenDecimals: number
    }>
    expect(allBefore.length).to.equal(2)

    // Advance time and withdraw the second lock
    await time.increaseTo(Number(endTime2))
    await erc20Locker.write.withdraw([1n], { account: addr2.account })

    // Now only the first (renounced but active) should remain
    const allAfter = (await lockerReader.read.getAllLocks()) as unknown as Array<{
      lockId: bigint
      owner: string
      token: string
      amount: bigint
      endTime: bigint
      tokenName: string
      tokenSymbol: string
      tokenDecimals: number
    }>
    expect(allAfter.length).to.equal(1)

    const item = allAfter[0]
    expect(item.lockId).to.equal(0n)
    expect(item.owner).to.equal(getAddress('0x0000000000000000000000000000000000000000'))
    expect(item.amount).to.equal(parseEther('100'))
  })

  it('getLocksInRange should return only active locks within [start, end)', async function () {
    const { erc20Token, erc20Locker, lockerReader, addr1, addr2 } = await loadFixture(deployFixture)

    const now = await time.latest()
    const endTime = BigInt(now + 3600)

    // Create three locks
    await erc20Locker.write.lock([addr1.account.address, erc20Token.address, parseEther('10'), endTime]) // id 0
    await erc20Locker.write.lock([addr2.account.address, erc20Token.address, parseEther('20'), endTime]) // id 1
    await erc20Locker.write.lock([addr1.account.address, erc20Token.address, parseEther('30'), endTime]) // id 2

    // Withdraw id 1 to make it inactive (amount == 0)
    await time.increaseTo(Number(endTime))
    await erc20Locker.write.withdraw([1n], { account: addr2.account })

    // Range [0, 2) should include only id 0 (id 1 is withdrawn)
    const range01 = (await lockerReader.read.getLocksInRange([0n, 2n])) as unknown as Array<{ lockId: bigint }>
    expect(range01.length).to.equal(1)
    expect(range01[0].lockId).to.equal(0n)

    // Range [1, 3) should include only id 2 (id 1 inactive)
    const range13 = (await lockerReader.read.getLocksInRange([1n, 3n])) as unknown as Array<{ lockId: bigint }>
    expect(range13.length).to.equal(1)
    expect(range13[0].lockId).to.equal(2n)
  })

  it('getLock should revert for non-active (withdrawn) lock', async function () {
    const { erc20Token, erc20Locker, lockerReader, addr1 } = await loadFixture(deployFixture)

    const endTime = BigInt((await time.latest()) + 100)
    await erc20Locker.write.lock([addr1.account.address, erc20Token.address, parseEther('1'), endTime])

    await time.increaseTo(Number(endTime))
    await erc20Locker.write.withdraw([0n], { account: addr1.account })

    try {
      await lockerReader.read.getLock([0n])
      expect.fail('Expected getLock to revert for withdrawn lock')
    } catch (err: any) {
      expect(err.message).to.include('LockNotFound')
    }
  })
})
