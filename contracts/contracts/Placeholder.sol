// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title Placeholder
 * @dev Simple placeholder contract - replace with your own contracts
 */
contract Placeholder {
    string public message;

    constructor(string memory _message) {
        message = _message;
    }

    function getMessage() public view returns (string memory) {
        return message;
    }
}
