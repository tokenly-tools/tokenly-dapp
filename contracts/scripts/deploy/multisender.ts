import hre from 'hardhat'

async function main() {
  const [deployer] = await hre.viem.getWalletClients()
  const publicClient = await hre.viem.getPublicClient()

  console.log('Deploying Multisender with account:', deployer.account.address)
  const balance = await publicClient.getBalance({ address: deployer.account.address })
  console.log('Account balance:', balance.toString())

  const multisender = await hre.viem.deployContract('Multisender')
  console.log('Multisender deployed to:', multisender.address)
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})
