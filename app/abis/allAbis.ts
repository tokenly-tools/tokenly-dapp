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

export const MULTISENDER_ABI = [
  {
    inputs: [],
    name: 'NoRecipientsProvided',
    type: 'error'
  },
  {
    inputs: [],
    name: 'RecipientsAndAmountsLengthMismatch',
    type: 'error'
  },
  {
    inputs: [],
    name: 'IncorrectTotalAmountSent',
    type: 'error'
  },
  {
    inputs: [],
    name: 'FailedToSendETH',
    type: 'error'
  },
  {
    inputs: [
      {
        internalType: 'address payable[]',
        name: 'recipients',
        type: 'address[]'
      },
      {
        internalType: 'uint256[]',
        name: 'amounts',
        type: 'uint256[]'
      }
    ],
    name: 'multisendNative',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'contract IERC20',
        name: 'token',
        type: 'address'
      },
      {
        internalType: 'address[]',
        name: 'recipients',
        type: 'address[]'
      },
      {
        internalType: 'uint256[]',
        name: 'amounts',
        type: 'uint256[]'
      }
    ],
    name: 'multisendToken',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const

export const ERC20_LOCKER_ABI = [
  {
    inputs: [],
    name: 'InvalidOwner',
    type: 'error'
  },
  {
    inputs: [],
    name: 'InvalidTokenAddress',
    type: 'error'
  },
  {
    inputs: [],
    name: 'InvalidAmount',
    type: 'error'
  },
  {
    inputs: [],
    name: 'InvalidEndTime',
    type: 'error'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address'
      },
      {
        internalType: 'address',
        name: 'token',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'endTime',
        type: 'uint256'
      }
    ],
    name: 'lock',
    outputs: [
      {
        internalType: 'uint256',
        name: 'lockId',
        type: 'uint256'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'lockId',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'newEndTime',
        type: 'uint256'
      }
    ],
    name: 'extendLock',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const

export const ERC20_MINIMAL_ABI = [
  {
    inputs: [],
    name: 'decimals',
    outputs: [
      {
        internalType: 'uint8',
        name: '',
        type: 'uint8'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'value', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const

export const LOCKER_READER_ABI = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'lockId',
        type: 'uint256'
      }
    ],
    name: 'getLock',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'lockId', type: 'uint256' },
          { internalType: 'address', name: 'owner', type: 'address' },
          { internalType: 'address', name: 'token', type: 'address' },
          { internalType: 'uint256', name: 'amount', type: 'uint256' },
          { internalType: 'uint256', name: 'endTime', type: 'uint256' },
          { internalType: 'string', name: 'tokenName', type: 'string' },
          { internalType: 'string', name: 'tokenSymbol', type: 'string' },
          { internalType: 'uint8', name: 'tokenDecimals', type: 'uint8' }
        ],
        internalType: 'struct LockerReader.LockView',
        name: 'viewData',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getAllLocks',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'lockId', type: 'uint256' },
          { internalType: 'address', name: 'owner', type: 'address' },
          { internalType: 'address', name: 'token', type: 'address' },
          { internalType: 'uint256', name: 'amount', type: 'uint256' },
          { internalType: 'uint256', name: 'endTime', type: 'uint256' },
          { internalType: 'string', name: 'tokenName', type: 'string' },
          { internalType: 'string', name: 'tokenSymbol', type: 'string' },
          { internalType: 'uint8', name: 'tokenDecimals', type: 'uint8' }
        ],
        internalType: 'struct LockerReader.LockView[]',
        name: 'locksData',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'start', type: 'uint256' },
      { internalType: 'uint256', name: 'endExclusive', type: 'uint256' }
    ],
    name: 'getLocksInRange',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'lockId', type: 'uint256' },
          { internalType: 'address', name: 'owner', type: 'address' },
          { internalType: 'address', name: 'token', type: 'address' },
          { internalType: 'uint256', name: 'amount', type: 'uint256' },
          { internalType: 'uint256', name: 'endTime', type: 'uint256' },
          { internalType: 'string', name: 'tokenName', type: 'string' },
          { internalType: 'string', name: 'tokenSymbol', type: 'string' },
          { internalType: 'uint8', name: 'tokenDecimals', type: 'uint8' }
        ],
        internalType: 'struct LockerReader.LockView[]',
        name: 'locksData',
        type: 'tuple[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const
