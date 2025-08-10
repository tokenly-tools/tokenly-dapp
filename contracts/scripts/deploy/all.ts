import hre from 'hardhat'
import { recordDeployment } from '../utils/deploymentRegistry'

async function main() {
  const [deployer] = await hre.viem.getWalletClients()
  const publicClient = await hre.viem.getPublicClient()

  console.log('Deploying with account:', deployer.account.address)
  const balance = await publicClient.getBalance({ address: deployer.account.address })
  console.log('Account balance:', balance.toString())

  console.log('Deploying ERC20TokenFactory...')
  const factory = await hre.viem.deployContract('ERC20TokenFactory', [])
  console.log('ERC20TokenFactory:', factory.address)
  await recordDeployment(hre, { contract: 'ERC20TokenFactory', address: factory.address, args: [] })

  console.log('Deploying ERC20Locker...')
  const locker = await hre.viem.deployContract('ERC20Locker')
  console.log('ERC20Locker:', locker.address)
  await recordDeployment(hre, { contract: 'ERC20Locker', address: locker.address })

  console.log('Deploying LockerReader...')
  const reader = await hre.viem.deployContract('LockerReader', [locker.address])
  console.log('LockerReader:', reader.address)
  await recordDeployment(hre, { contract: 'LockerReader', address: reader.address, args: [locker.address] })

  console.log('Deploying Multisender...')
  const multisender = await hre.viem.deployContract('Multisender')
  console.log('Multisender:', multisender.address)
  await recordDeployment(hre, { contract: 'Multisender', address: multisender.address })

  console.log('All deployments complete.')
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})
