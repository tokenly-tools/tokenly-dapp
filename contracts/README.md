# Tokenly DApp Smart Contracts

## Project Overview

This project contains the smart contracts for the Tokenly DApp, a decentralized application for managing and interacting with ERC20 tokens. The contracts are built using Hardhat and OpenZeppelin.

## Contracts

### Core Contracts

*   **ERC20Locker.sol**: A contract for time-locking ERC20 tokens. Users can lock a specified amount of an ERC20 token for a designated recipient, which can only be withdrawn after the lock's end time has passed.
*   **Multisender.sol**: A contract for batch sending of ETH and ERC20 tokens to multiple addresses in a single transaction, saving on gas fees.
*   **LockerReader.sol**: A read-only helper contract to fetch lock data from `ERC20Locker` with token metadata.
*   **ERC20Token.sol**: A simple ERC20 token implementation.
*   **ERC20TokenFactory.sol**: A factory contract for creating new ERC20 tokens with custom parameters.

### Mocks

The `contracts/mocks` directory contains mock contracts used for testing purposes.

## How to Deploy

The contracts can be deployed to a network using the following Hardhat scripts:

*   **Deploy all contracts:**
    ```bash
    npx hardhat run scripts/deploy/all.ts --network <network-name>
    ```
*   **Deploy ERC20TokenFactory:**
    ```bash
    npx hardhat run scripts/deploy/factory.ts --network <network-name>
    ```
*   **Deploy ERC20Locker:**
    ```bash
    npx hardhat run scripts/deploy/locker.ts --network <network-name>
    ```
*   **Deploy Multisender:**
    ```bash
    npx hardhat run scripts/deploy/multisender.ts --network <network-name>
    ```

Replace `<network-name>` with the desired network (e.g., `coreTestnet2`, `coreMainnet`, `localhost`).

## How to Test

The project has a comprehensive test suite. To run the tests, use the following command:

```bash
npx hardhat test
```

### Test Coverage

To generate a test coverage report, run the following command:

```bash
npx hardhat coverage
```

The project has a comprehensive test suite with the following coverage:

*   **Statements:** 100%
*   **Branches:** 89.29%
*   **Functions:** 100%
*   **Lines:** 99.32%

This high level of test coverage ensures the reliability and security of the smart contracts.