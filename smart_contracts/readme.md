# Smart Contracts Documentation

This directory contains the smart contracts that power the ChainBallot voting platform.

## VotingPowerNFT Contract

The `VotingPowerNFT` contract (nft.sol) handles voter verification through NFT tokens.

### Key Functions:

- `mintNFT(address recipient)`: Mints a single NFT to an address (admin only)
- `batchMintNFTs(address[] recipients)`: Mints NFTs to multiple addresses (admin only) 
- `balanceOfAddress(address addr)`: Returns NFT balance of an address
- `hasReceived(address addr)`: Checks if address has received an NFT
- `getNFTName()`: Returns the NFT collection name

### Features:

- ERC721 standard implementation
- One NFT per address restriction
- Batch minting capability
- Owner-only minting permissions
- Built-in tracking of NFT distribution

### Usage:

1. Deploy the contract
2. Admin mints NFTs to registered voter addresses
3. Voters must possess NFT to participate in voting
4. NFT ownership verification happens automatically during voting

### Security:

- Ownable contract pattern
- Duplicate minting prevention
- OpenZeppelin secure contract standards

### Dependencies:

- OpenZeppelin Contracts v4.x
- Solidity ^0.8.0

The NFT contract serves as the foundation for voter verification in the ChainBallot system, ensuring only authorized participants can cast votes while maintaining a decentralized and transparent process.

