// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EthRejecter
 * @notice A contract that rejects ETH transfers for testing purposes
 */
contract EthRejecter {
    // This contract has no payable receive() or fallback() function
    // So any ETH sent to it will fail and revert

    function someFunction() external pure returns (string memory) {
        return "I reject ETH!";
    }
}
