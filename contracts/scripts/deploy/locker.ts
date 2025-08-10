import hre from 'hardhat'

async function main() {
  const [deployer] = await hre.viem.getWalletClients()
  const publicClient = await hre.viem.getPublicClient()

  console.log('Deploying ERC20Locker with account:', deployer.account.address)
  const balance = await publicClient.getBalance({ address: deployer.account.address })
  console.log('Account balance:', balance.toString())

  const erc20Locker = await hre.viem.deployContract('ERC20Locker')
  console.log('ERC20Locker deployed to:', erc20Locker.address)

  console.log('Deploying LockerReader bound to locker...')
  const lockerReader = await hre.viem.deployContract('LockerReader', [erc20Locker.address])
  console.log('LockerReader deployed to:', lockerReader.address)
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})
