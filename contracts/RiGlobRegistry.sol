// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RiGlobRegistry
 * @dev Simple contract to register pins on the RiGlob 3D world map.
 * Accepts a configurable submission fee (default 0.001 native tokens), 
 * emits events on-chain for frontend integration, and allows the admin to withdraw funds.
 */
contract RiGlobRegistry {
    address public admin;
    uint256 public submitFee;

    event PinSubmitted(address indexed user, string metadataId, uint256 timestamp);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event FundsWithdrawn(address indexed admin, uint256 amount);
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);

    modifier onlyAdmin() {
        require(msg.sender == admin, "RiGlobRegistry: caller is not the admin");
        _;
    }

    constructor() {
        admin = msg.sender;
        submitFee = 0.001 ether; // 0.001 RITUAL (18 decimals)
    }

    /**
     * @notice Submits a pin to the registry with the required payment fee.
     * @param metadataId The identifier (e.g. IPFS hash, database UUID) representing the pin metadata.
     */
    function submitPin(string calldata metadataId) external payable {
        require(msg.value == submitFee, "RiGlobRegistry: incorrect payment fee");
        emit PinSubmitted(msg.sender, metadataId, block.timestamp);
    }

    /**
     * @notice Updates the submission fee. Only callable by admin.
     * @param newFee The new fee amount in wei.
     */
    function updateFee(uint256 newFee) external onlyAdmin {
        uint256 oldFee = submitFee;
        submitFee = newFee;
        emit FeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Withdraws all collected native tokens from the contract to the admin address.
     */
    function withdraw() external onlyAdmin {
        uint256 balance = address(this).balance;
        require(balance > 0, "RiGlobRegistry: no funds available");
        
        (bool success, ) = payable(admin).call{value: balance}("");
        require(success, "RiGlobRegistry: withdrawal failed");
        
        emit FundsWithdrawn(admin, balance);
    }

    /**
     * @notice Transfers administrative ownership of the contract.
     * @param newAdmin The address of the new administrator.
     */
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "RiGlobRegistry: invalid address");
        emit AdminTransferred(admin, newAdmin);
        admin = newAdmin;
    }
}
