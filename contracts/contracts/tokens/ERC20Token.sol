// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title ERC20Token - Basic ERC20 implementation
 * @author https://tokenly.tools
 * @notice A simple ERC20 token implementation with customizable parameters
 */
contract ERC20Token is ERC20 {
    /**
     * @notice Creates a new ERC20 token with specified parameters
     * @param name The name of the token
     * @param symbol The symbol of the token
     * @param initialHolder The address that will receive the initial token supply
     * @param initialSupply The initial supply of tokens to mint
     */
    constructor(
        string memory name,
        string memory symbol,
        address initialHolder,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(initialHolder, initialSupply);
    }
}
