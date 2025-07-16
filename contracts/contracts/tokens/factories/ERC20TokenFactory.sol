// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20Token} from "../ERC20Token.sol";

/**
 * @title ERC20TokenFactory - Factory for deploying ERC20 tokens
 * @author https://tokenly.tools
 * @notice Factory contract for creating ERC20 tokens with custom parameters
 */
contract ERC20TokenFactory {
    /**
     * @notice Emitted when a new ERC20 token is created
     * @param tokenAddress The address of the newly created token contract
     * @param name The name of the created token
     * @param symbol The symbol of the created token
     * @param initialHolder The address that received the initial token supply
     * @param initialSupply The initial supply of tokens that were minted
     * @param creator The address that created the token
     */
    event TokenCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        address indexed initialHolder,
        uint256 initialSupply,
        address indexed creator
    );

    error EmptyName();
    error EmptySymbol();
    error InvalidInitialHolder();

    /**
     * @notice Creates a new ERC20 token with the specified parameters
     * @param name The name of the token
     * @param symbol The symbol of the token
     * @param initialHolder The address that will receive the initial supply
     * @param initialSupply The initial supply of tokens (in wei)
     * @return tokenAddress The address of the newly created token
     */
    function createToken(
        string calldata name,
        string calldata symbol,
        address initialHolder,
        uint256 initialSupply
    ) external returns (address tokenAddress) {
        if (bytes(name).length == 0) revert EmptyName();
        if (bytes(symbol).length == 0) revert EmptySymbol();
        if (initialHolder == address(0)) revert InvalidInitialHolder();

        ERC20Token newToken = new ERC20Token(
            name,
            symbol,
            initialHolder,
            initialSupply
        );

        tokenAddress = address(newToken);

        emit TokenCreated(
            tokenAddress,
            name,
            symbol,
            initialHolder,
            initialSupply,
            msg.sender
        );

        return tokenAddress;
    }
}
