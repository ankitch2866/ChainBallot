// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract VotingPowerNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // List of users who have received at least one NFT
    address[] private usersWithNFT;
    // Mapping to track if an address has already received an NFT
    mapping(address => bool) private _hasReceived;

    constructor(string memory name_, string memory symbol_, address initialOwner) 
        ERC721(name_, symbol_)
        Ownable(initialOwner)
    {
        // initialOwner is set as contract owner via Ownable
    }

    // Mint a new NFT to the specified recipient
    function mintNFT(address recipient) public {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _mint(recipient, newTokenId);

        if (!_hasReceived[recipient]) {
            _hasReceived[recipient] = true;
            usersWithNFT.push(recipient);
        }
    }

    // Mint NFTs to multiple recipients
    function batchMintNFTs(address[] memory recipients) public {
        for (uint256 i = 0; i < recipients.length; i++) {
            address recipient = recipients[i];
            _tokenIds.increment();
            uint256 newTokenId = _tokenIds.current();
            _mint(recipient, newTokenId);

            if (!_hasReceived[recipient]) {
                _hasReceived[recipient] = true;
                usersWithNFT.push(recipient);
            }
        }
    }

    // Get the balance (number of NFTs) of an address
    function balanceOfAddress(address owner) public view returns (uint256) {
        return balanceOf(owner);
    }

    // Check if an address has received an NFT
    function hasReceived(address addr) public view returns (bool) {
        return _hasReceived[addr];
    }

    // Get the NFT token name
    function getNFTName() public view returns (string memory) {
        return name();
    }

    // Get the owner of this contract
    function getContractOwner() public view returns (address) {
        return owner();
    }

    // Get the owner of a specific token
    function getOwnerOfToken(uint256 tokenId) public view returns (address) {
        return ownerOf(tokenId);
    }

    // Get the list of users who have received NFTs
    function getUsersWithNFTs() public view returns (address[] memory) {
        return usersWithNFT;
    }
}