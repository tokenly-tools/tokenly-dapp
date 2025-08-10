import type { HardhatUserConfig } from 'hardhat/config'
import { vars } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox-viem'
import 'hardhat-contract-sizer'
import 'solidity-coverage'

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.28',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 31337
    },
    coreTestnet2: {
      url: process.env.CORE_TESTNET2_URL || 'https://rpc.test2.btcs.network',
      accounts: vars.has('PRIVATE_KEY') ? [vars.get('PRIVATE_KEY')] : [],
      chainId: 1114
    }
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
    only: []
  },
  mocha: {
    timeout: 40000
  },
  sourcify: {
    enabled: true
  }
}

export default config
