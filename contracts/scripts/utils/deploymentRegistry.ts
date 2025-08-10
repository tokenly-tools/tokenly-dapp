import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

export type DeploymentRecord = {
  contract: string
  address: string
  network: string
  chainId: number
  deployer?: string
  blockNumber?: number
  txHash?: string
  args?: unknown[]
  timestamp: string
}

export type RegistryFile = {
  network: string
  chainId: number
  updatedAt: string
  deployments: Record<
    string,
    {
      latest: string
      history: DeploymentRecord[]
    }
  >
}

async function ensureDir(dir: string) {
  await mkdir(dir, { recursive: true })
}

function getRegistryPath(): string {
  // Resolve to contracts/deployments relative to this file
  return path.resolve(__dirname, '../../deployments')
}

export async function recordDeployment(
  hre: HardhatRuntimeEnvironment,
  data: { contract: string; address: string; args?: unknown[]; txHash?: string }
) {
  const publicClient = await hre.viem.getPublicClient()
  const chainId = await publicClient.getChainId()
  const blockNumber = await publicClient.getBlockNumber()
  const [wallet] = await hre.viem.getWalletClients()

  const network = hre.network.name
  const timestamp = new Date().toISOString()

  const record: DeploymentRecord = {
    contract: data.contract,
    address: data.address,
    network,
    chainId,
    deployer: wallet?.account.address,
    blockNumber: Number(blockNumber),
    txHash: data.txHash,
    args: data.args,
    timestamp
  }

  const baseDir = getRegistryPath()
  await ensureDir(baseDir)
  const filePath = path.join(baseDir, `${chainId}-${network}.json`)

  let registry: RegistryFile
  try {
    const contents = await readFile(filePath, 'utf8')
    registry = JSON.parse(contents) as RegistryFile
  } catch {
    registry = {
      network,
      chainId,
      updatedAt: timestamp,
      deployments: {}
    }
  }

  const existing = registry.deployments[data.contract] ?? { latest: '', history: [] }
  existing.latest = data.address
  existing.history.push(record)
  registry.deployments[data.contract] = existing
  registry.updatedAt = timestamp

  await writeFile(filePath, JSON.stringify(registry, null, 2) + '\n', 'utf8')
  return { filePath }
}

export async function loadRegistry(
  hre: HardhatRuntimeEnvironment
): Promise<{ filePath: string; registry: RegistryFile | null }> {
  const publicClient = await hre.viem.getPublicClient()
  const chainId = await publicClient.getChainId()
  const network = hre.network.name
  const baseDir = getRegistryPath()
  const filePath = path.join(baseDir, `${chainId}-${network}.json`)
  try {
    const contents = await readFile(filePath, 'utf8')
    const json = JSON.parse(contents) as RegistryFile
    return { filePath, registry: json }
  } catch {
    return { filePath, registry: null }
  }
}

export function latestAddresses(registry: RegistryFile | null): Record<string, string> {
  if (!registry) return {}
  const out: Record<string, string> = {}
  for (const [name, meta] of Object.entries(registry.deployments)) {
    out[name] = meta.latest
  }
  return out
}
