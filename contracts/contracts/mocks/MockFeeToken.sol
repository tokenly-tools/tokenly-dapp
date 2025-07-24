// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockFeeToken is ERC20 {
    uint256 public feePercent; // Fee percentage in basis points (e.g., 100 = 1%)

    constructor(
        string memory name,
        string memory symbol,
        address initialHolder,
        uint256 initialSupply,
        uint256 _feePercent
    ) ERC20(name, symbol) {
        _mint(initialHolder, initialSupply);
        feePercent = _feePercent;
    }

    function setFeePercent(uint256 _feePercent) external {
        require(_feePercent <= 1000, "Fee too high"); // Max 10%
        feePercent = _feePercent;
    }

    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override {
        uint256 fee = (amount * feePercent) / 10000;
        uint256 netAmount = amount - fee;

        // Burn the fee (or could send to a fee collector)
        if (fee > 0) {
            super._update(from, address(0), fee);
        }

        super._update(from, to, netAmount);
    }
}
