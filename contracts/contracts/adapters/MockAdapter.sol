// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IAdapter.sol";

contract MockReceiptToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}

contract MockAdapter is IAdapter {
    string public adapterName;
    MockReceiptToken public receiptToken;

    constructor(string memory _name, string memory _symbol) {
        adapterName = _name;
        receiptToken = new MockReceiptToken(string(abi.encodePacked("Receipt ", _name)), _symbol);
    }

    function name() external view override returns (string memory) {
        return adapterName;
    }

    function stake(address token, uint256 amount, address onBehalfOf) external payable override returns (uint256) {
        // Transfer tokens from caller (StakingRouter) to this adapter
        if (token != address(0)) {
            // ERC20 token
            IERC20(token).transferFrom(msg.sender, address(this), amount);
        }
        // For ETH, it's already sent via msg.value
        
        // Mint receipt tokens to user (1:1 ratio for PoC)
        receiptToken.mint(onBehalfOf, amount);
        return amount;
    }

    function unstake(address token, uint256 amount, address to) external override returns (uint256) {
        // Burn receipt tokens from the caller
        receiptToken.burn(msg.sender, amount);
        
        // Transfer underlying tokens back to user
        if (token == address(0)) {
            // ETH
            payable(to).transfer(amount);
        } else {
            // ERC20
            IERC20(token).transfer(to, amount);
        }
        
        return amount;
    }

    function getBalance(address token, address account) external view override returns (uint256) {
        // In a real adapter, this would call the protocol's balanceOf function
        // e.g., aToken.balanceOf(account) for Aave
        return receiptToken.balanceOf(account);
    }
}
