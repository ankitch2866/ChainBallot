// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract VotingPowerNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    mapping(address => bool) public hasReceivedNFT;

    constructor() ERC721("Voting Power NFT", "CHAINBALLOT") Ownable(msg.sender) {}

    // Mint NFT to a single address (only once)
    function mintNFT(address recipient) public onlyOwner returns (uint256) {
        require(!hasReceivedNFT[recipient], "Already registered");

        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(recipient, newItemId);
        hasReceivedNFT[recipient] = true;

        return newItemId;
    }

    // Batch mint NFTs to multiple addresses
    function batchMintNFTs(address[] memory recipients) public onlyOwner {
        for (uint256 i = 0; i < recipients.length; i++) {
            if (!hasReceivedNFT[recipients[i]]) {
                mintNFT(recipients[i]);
            }
        }
    }

    // Check balance of a given address
    function balanceOfAddress(address addr) public view returns (uint256) {
        return balanceOf(addr);
    }

    // Check if address has received NFT
    function hasReceived(address addr) public view returns (bool) {
        return hasReceivedNFT[addr];
    }

    // Get NFT name
    function getNFTName() public view returns (string memory) {
        return name();
    }

    // Get contract owner
    function getContractOwner() public view returns (address) {
        return owner();
    }

    // Get owner of specific token ID
    function getOwnerOfToken(uint256 tokenId) public view returns (address) {
        return ownerOf(tokenId);
    }
}