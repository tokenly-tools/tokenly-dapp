// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Multisender
 * @author https://tokenly.tools
 * @notice A contract for batch sending of ETH and ERC20 tokens.
 */
contract Multisender is ReentrancyGuard {
    using SafeERC20 for IERC20;

    error NoRecipientsProvided();
    error RecipientsAndAmountsLengthMismatch();
    error IncorrectTotalAmountSent();
    error FailedToSendETH();

    /**
     * @notice Sends ETH to multiple addresses.
     * @param recipients An array of addresses to send ETH to.
     * @param amounts An array of amounts to send to each recipient.
     */
    function multisendNative(
        address payable[] calldata recipients,
        uint256[] calldata amounts
    ) external payable nonReentrant {
        uint256 totalAmount = 0;
        uint256 numRecipients = recipients.length;

        if (numRecipients == 0) {
            revert NoRecipientsProvided();
        }
        if (numRecipients != amounts.length) {
            revert RecipientsAndAmountsLengthMismatch();
        }

        for (uint256 i = 0; i < numRecipients; ++i) {
            totalAmount += amounts[i];
        }

        if (msg.value != totalAmount) {
            revert IncorrectTotalAmountSent();
        }

        for (uint256 i = 0; i < numRecipients; ++i) {
            (bool success, ) = recipients[i].call{value: amounts[i]}("");
            if (!success) {
                revert FailedToSendETH();
            }
        }
    }

    /**
     * @notice Sends a specified ERC20 token to multiple addresses.
     * @param token The address of the ERC20 token to send.
     * @param recipients An array of addresses to send the token to.
     * @param amounts An array of amounts to send to each recipient.
     */
    function multisendToken(
        IERC20 token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external nonReentrant {
        uint256 totalAmount = 0;
        uint256 numRecipients = recipients.length;

        if (numRecipients == 0) {
            revert NoRecipientsProvided();
        }
        if (numRecipients != amounts.length) {
            revert RecipientsAndAmountsLengthMismatch();
        }

        for (uint256 i = 0; i < numRecipients; ++i) {
            totalAmount += amounts[i];
        }

        token.safeTransferFrom(msg.sender, address(this), totalAmount);

        for (uint256 i = 0; i < numRecipients; ++i) {
            token.safeTransfer(recipients[i], amounts[i]);
        }
    }
}
