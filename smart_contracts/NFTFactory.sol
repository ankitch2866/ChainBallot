// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./VotingPowerNFT.sol";

contract NFTFactory is Ownable {
    // Mapping from identifier to owner address
    mapping(string => address) public identifierToOwner;
    // Mapping from identifier to deployed VotingPowerNFT contract address
    mapping(string => address) public identifierToContract;

    // Track registered users per identifier
    struct IdentifierInfo {
        address[] registeredUsers;
        mapping(address => bool) isRegistered;
    }

    mapping(string => IdentifierInfo) private identifiers;

    constructor() Ownable(msg.sender) {
        // Factory owner is set to deployer
    }

    // Deploy a new VotingPowerNFT contract for a given identifier
    function createVotingPowerNFT(
        string memory identifier,
        string memory name,
        string memory symbol
    ) public {
        require(identifierToOwner[identifier] == address(0), "Identifier already used");
        VotingPowerNFT nft = new VotingPowerNFT(name, symbol, msg.sender);
        identifierToOwner[identifier] = msg.sender;
        identifierToContract[identifier] = address(nft);
    }

    // Mint a single NFT via the factory
    function mintNFT(string memory identifier, address recipient) public {
        require(identifierToOwner[identifier] == msg.sender, "Not the identifier owner");
        address contractAddr = identifierToContract[identifier];
        require(contractAddr != address(0), "NFT contract does not exist");
        VotingPowerNFT(contractAddr).mintNFT(recipient);
    }

    // Batch mint NFTs via the factory
    function batchMintNFTs(string memory identifier, address[] memory recipients) public {
        require(identifierToOwner[identifier] == msg.sender, "Not the identifier owner");
        address contractAddr = identifierToContract[identifier];
        require(contractAddr != address(0), "NFT contract does not exist");
        VotingPowerNFT(contractAddr).batchMintNFTs(recipients);
    }

    // Query balance of an address in a specific VotingPowerNFT contract
    function balanceOfAddress(string memory identifier, address user) public view returns (uint256) {
        address contractAddr = identifierToContract[identifier];
        require(contractAddr != address(0), "NFT contract does not exist");
        return VotingPowerNFT(contractAddr).balanceOfAddress(user);
    }

    // Check if a user has received an NFT in a specific contract
    function hasReceived(string memory identifier, address user) public view returns (bool) {
        address contractAddr = identifierToContract[identifier];
        require(contractAddr != address(0), "NFT contract does not exist");
        return VotingPowerNFT(contractAddr).hasReceived(user);
    }

    // Get the NFT contract's name
    function getNFTName(string memory identifier) public view returns (string memory) {
        address contractAddr = identifierToContract[identifier];
        require(contractAddr != address(0), "NFT contract does not exist");
        return VotingPowerNFT(contractAddr).getNFTName();
    }

    // Get the owner of the NFT contract
    function getContractOwner(string memory identifier) public view returns (address) {
        address contractAddr = identifierToContract[identifier];
        require(contractAddr != address(0), "NFT contract does not exist");
        return VotingPowerNFT(contractAddr).getContractOwner();
    }

    // Get the owner of a specific token in the NFT contract
    function getOwnerOfToken(string memory identifier, uint256 tokenId) public view returns (address) {
        address contractAddr = identifierToContract[identifier];
        require(contractAddr != address(0), "NFT contract does not exist");
        return VotingPowerNFT(contractAddr).getOwnerOfToken(tokenId);
    }

    // Get the list of users who have received NFTs in this contract
    function getUsersWithNFTs(string memory identifier) public view returns (address[] memory) {
        address contractAddr = identifierToContract[identifier];
        require(contractAddr != address(0), "NFT contract does not exist");
        return VotingPowerNFT(contractAddr).getUsersWithNFTs();
    }

    // ========== 🔥 Updated Register & Fetch logic 🔥 ==========

    // Register user address under a specific identifier
    function registerUser(string calldata identifier) external {
        require(identifierToContract[identifier] != address(0), "Identifier not initialized");

        IdentifierInfo storage info = identifiers[identifier];
        address user = msg.sender;

        if (!info.isRegistered[user]) {
            info.registeredUsers.push(user);
            info.isRegistered[user] = true;
        }
    }

    // Fetch all registered users who currently do NOT own any NFT
    function fetchData(string calldata identifier) external view returns (address[] memory) {
        require(identifierToContract[identifier] != address(0), "Identifier not initialized");

        IdentifierInfo storage info = identifiers[identifier];
        address nftContract = identifierToContract[identifier];

        uint256 count = 0;
        for (uint256 i = 0; i < info.registeredUsers.length; i++) {
            uint256 balance = IERC721(nftContract).balanceOf(info.registeredUsers[i]);
            if (balance == 0) {
                count++;
            }
        }

        address[] memory nonOwners = new address[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < info.registeredUsers.length; i++) {
            uint256 balance = IERC721(nftContract).balanceOf(info.registeredUsers[i]);
            if (balance == 0) {
                nonOwners[index] = info.registeredUsers[i];
                index++;
            }
        }

        return nonOwners;
    }
}