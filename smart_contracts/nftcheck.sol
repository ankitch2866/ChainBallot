// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Minimal ERC721 Interface
interface IERC721 {
    function balanceOf(address owner) external view returns (uint256);
}

contract CheckNFT {
    
    struct IdentifierInfo {
        address nftContract;
        address[] registeredUsers;
        mapping(address => bool) isRegistered;
        mapping(address => bool) hasNFT;
    }

    mapping(string => IdentifierInfo) private identifiers;

    // Initialize an identifier with its associated NFT contract address
    function initialize(string calldata identifier, address nftContractAddress) external {
        require(identifiers[identifier].nftContract == address(0), "Identifier already initialized");
        identifiers[identifier].nftContract = nftContractAddress;
    }

    // Register msg.sender under a specific identifier
    function registerUser(string calldata identifier) external {
        IdentifierInfo storage info = identifiers[identifier];
        require(info.nftContract != address(0), "Identifier not initialized");

        address user = msg.sender;

        if (!info.isRegistered[user]) {
            uint256 balance = IERC721(info.nftContract).balanceOf(user);

            info.registeredUsers.push(user);
            info.isRegistered[user] = true;
            info.hasNFT[user] = (balance > 0);
        }
    }

    // Fetch all registered users who do NOT own any NFT from the associated contract
    function fetchData(string calldata identifier) external view returns (address[] memory) {
        IdentifierInfo storage info = identifiers[identifier];
        require(info.nftContract != address(0), "Identifier not initialized");

        uint256 count = 0;
        for (uint256 i = 0; i < info.registeredUsers.length; i++) {
            if (!info.hasNFT[info.registeredUsers[i]]) {
                count++;
            }
        }

        address[] memory nonOwners = new address[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < info.registeredUsers.length; i++) {
            if (!info.hasNFT[info.registeredUsers[i]]) {
                nonOwners[index] = info.registeredUsers[i];
                index++;
            }
        }

        return nonOwners;
    }
}