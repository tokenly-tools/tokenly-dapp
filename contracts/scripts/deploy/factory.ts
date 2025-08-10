import hre from 'hardhat'

async function main() {
  const [deployer] = await hre.viem.getWalletClients()
  const publicClient = await hre.viem.getPublicClient()

  console.log('Deploying ERC20TokenFactory with account:', deployer.account.address)
  const balance = await publicClient.getBalance({ address: deployer.account.address })
  console.log('Account balance:', balance.toString())

  const erc20TokenFactory = await hre.viem.deployContract('ERC20TokenFactory', [])
  console.log('ERC20TokenFactory deployed to:', erc20TokenFactory.address)

  try {
    console.log('Verifying ERC20TokenFactory...')
    await hre.run('verify:verify', {
      address: erc20TokenFactory.address,
      constructorArguments: []
    })
  } catch (e) {
    console.warn('Verification (ERC20TokenFactory) skipped/failed:', (e as Error).message)
  }
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})
