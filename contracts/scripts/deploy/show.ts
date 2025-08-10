import hre from 'hardhat'
import { latestAddresses, loadRegistry } from '../utils/deploymentRegistry'

async function main() {
  const { filePath, registry } = await loadRegistry(hre)
  const latest = latestAddresses(registry)
  console.log(`Registry file: ${filePath}`)
  if (!registry) {
    console.log('No deployments recorded yet for this network.')
    return
  }
  console.log(`Network: ${registry.network} (chainId=${registry.chainId})`)
  console.log(`Updated: ${registry.updatedAt}`)
  console.log('Latest addresses:')
  for (const [name, addr] of Object.entries(latest)) {
    console.log(`- ${name}: ${addr}`)
  }
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})
