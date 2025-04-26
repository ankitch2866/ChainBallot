# Smart Contracts Documentation

This directory contains the smart contracts that power the ChainBallot voting platform.

## Contract Overview

### 1. ChainBallot (voting.sol)
The main voting contract that handles the creation and management of voting sessions.

#### Key Functions:
- `createVoting`: Creates a new voting session
- `vote`: Casts a vote for a candidate
- `addCandidate`: Adds a new candidate to a voting session
- `deleteCandidate`: Removes a candidate from a voting session
- `deleteVoting`: Deletes an existing voting session
- `getVotes`: Retrieves vote count for a candidate
- `getCandidates`: Gets list of candidates
- `getVotingDetails`: Retrieves voting session details
- `getOngoingVotings`: Lists all active voting sessions

#### Features:
- NFT-based voter verification
- Time-based voting sessions
- Multiple candidate support
- Vote tracking and counting
- Creator-only administrative functions

### 2. NFTFactory (NFTFactory.sol)
Factory contract for creating and managing VotingPowerNFT instances.

#### Key Functions:
- `createVotingPowerNFT`: Deploys a new VotingPowerNFT contract
- `mintNFT`: Mints a single NFT
- `batchMintNFTs`: Mints NFTs to multiple addresses
- `registerUser`: Registers a user for NFT tracking
- `fetchData`: Retrieves users without NFTs

#### Features:
- Factory pattern implementation
- Batch minting capability
- User registration system
- NFT ownership tracking

### 3. VotingPowerNFT (VotingPowerNFT.sol)
ERC721-based NFT contract for voter verification.

#### Key Functions:
- `mintNFT`: Mints a single NFT
- `batchMintNFTs`: Mints NFTs to multiple addresses
- `balanceOfAddress`: Checks NFT balance
- `hasReceived`: Verifies NFT ownership
- `getUsersWithNFTs`: Lists all NFT holders

#### Features:
- ERC721 standard implementation
- One NFT per address restriction
- Batch minting capability
- Owner-only minting permissions
- Built-in tracking of NFT distribution

### 4. CheckNFT (nftcheck.sol)
Utility contract for tracking NFT ownership and user registration.

#### Key Functions:
- `initialize`: Sets up NFT contract tracking
- `registerUser`: Registers a user
- `fetchData`: Retrieves users without NFTs

#### Features:
- User registration system
- NFT ownership verification
- Identifier-based organization

## Security Features

- Ownable contract pattern
- Duplicate minting prevention
- OpenZeppelin secure contract standards
- Creator-only administrative functions
- NFT-based voter verification

## Dependencies

- OpenZeppelin Contracts v4.x
- Solidity ^0.8.20

## Usage Flow

1. Deploy NFTFactory contract
2. Create VotingPowerNFT instances for different voting sessions
3. Mint NFTs to registered voters
4. Create voting sessions using ChainBallot
5. Voters cast votes using their NFTs
6. Track and verify votes through the system

## Development Notes

- All contracts use the latest Solidity version (0.8.20)
- Contracts follow OpenZeppelin best practices
- Gas optimization techniques implemented
- Comprehensive error handling
- Clear separation of concerns between contracts

