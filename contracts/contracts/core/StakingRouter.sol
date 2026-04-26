// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IAdapter.sol";

contract StakingRouter is Ownable {
    using SafeERC20 for IERC20;

    uint256 public feeBasisPoints = 50; // 0.5% (50/10000)
    uint256 public constant MAX_FEE = 500; // Max 5%
    address public feeRecipient;

    mapping(address => bool) public supportedAdapters;

    event Staked(address indexed user, address indexed token, uint256 amount, address adapter, uint256 fee);
    event FeeUpdated(uint256 newFee);
    event FeeRecipientUpdated(address newRecipient);
    event AdapterStatusUpdated(address adapter, bool status);

    constructor(address _feeRecipient) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
    }

    function setFee(uint256 _feeBasisPoints) external onlyOwner {
        require(_feeBasisPoints <= MAX_FEE, "Fee too high");
        feeBasisPoints = _feeBasisPoints;
        emit FeeUpdated(_feeBasisPoints);
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid recipient");
        feeRecipient = _feeRecipient;
        emit FeeRecipientUpdated(_feeRecipient);
    }

    function setAdapter(address adapter, bool status) external onlyOwner {
        supportedAdapters[adapter] = status;
        emit AdapterStatusUpdated(adapter, status);
    }

    function stake(address token, uint256 amount, address adapter) external payable {
        require(supportedAdapters[adapter], "Adapter not supported");

        uint256 amountAfterFee = amount;
        uint256 fee = (amount * feeBasisPoints) / 10000;

        if (token == address(0)) {
            require(msg.value == amount, "ETH value mismatch");
            if (fee > 0) {
                (bool success, ) = feeRecipient.call{value: fee}("");
                require(success, "Fee transfer failed");
                amountAfterFee = amount - fee;
            }
            
            IAdapter(adapter).stake{value: amountAfterFee}(token, amountAfterFee, msg.sender);
        } else {
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
            if (fee > 0) {
                IERC20(token).safeTransfer(feeRecipient, fee);
                amountAfterFee = amount - fee;
            }
            
            IERC20(token).forceApprove(adapter, amountAfterFee);
            IAdapter(adapter).stake(token, amountAfterFee, msg.sender);
        }

        emit Staked(msg.sender, token, amount, adapter, fee);
    }

    /**
     * @notice Unstakes tokens from a protocol adapter
     * @param token The token to unstake (address(0) for ETH)
     * @param amount The amount to unstake
     * @param adapter The adapter address to unstake from
     */
    function unstake(address token, uint256 amount, address adapter) external {
        require(amount > 0, "Amount must be greater than 0");
        require(adapter != address(0), "Invalid adapter");

        // Call the adapter's unstake function
        uint256 amountUnstaked = IAdapter(adapter).unstake(token, amount, msg.sender);

        emit Unstaked(msg.sender, token, amountUnstaked, adapter);
    }

    event Unstaked(address indexed user, address indexed token, uint256 amount, address indexed adapter);

    /**
     * @notice Returns the current balance of a user in a specific protocol via its adapter.
     * @param adapter The adapter address.
     * @param token The token address.
     * @param user The user address.
     * @return balance The current balance.
     */
    function getProtocolBalance(address adapter, address token, address user) external view returns (uint256) {
        require(supportedAdapters[adapter], "Adapter not supported");
        return IAdapter(adapter).getBalance(token, user);
    }

    // Allow receiving ETH
    receive() external payable {}
}
