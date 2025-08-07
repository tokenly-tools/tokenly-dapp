export const ERC20_TOKEN_FACTORY_ABI = [
  {
    inputs: [],
    name: 'EmptyName',
    type: 'error'
  },
  {
    inputs: [],
    name: 'EmptySymbol',
    type: 'error'
  },
  {
    inputs: [],
    name: 'InvalidInitialHolder',
    type: 'error'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'name',
        type: 'string'
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'symbol',
        type: 'string'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'initialHolder',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'initialSupply',
        type: 'uint256'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'creator',
        type: 'address'
      }
    ],
    name: 'TokenCreated',
    type: 'event'
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'name',
        type: 'string'
      },
      {
        internalType: 'string',
        name: 'symbol',
        type: 'string'
      },
      {
        internalType: 'address',
        name: 'initialHolder',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'initialSupply',
        type: 'uint256'
      }
    ],
    name: 'createToken',
    outputs: [
      {
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const
