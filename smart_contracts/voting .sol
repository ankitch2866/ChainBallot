// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

interface IERC721 {
    function balanceOf(address owner) external view returns (uint256);
}

contract ChainBallot {
    struct Voting {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        address nftContract;
        bool exists;
        string[] candidates;
        mapping(address => bool) voted;
        mapping(string => uint256) votes;
    }

    // Unique identifier to Voting struct mapping
    mapping(string => Voting) private votings;
    // Active voting identifiers
    string[] private activeIdentifiers;
    // Mapping from voting identifier to index in activeIdentifiers array
    mapping(string => uint256) private activeVotingIndex;
    // Counter for active votings
    uint256 public votingCounter;

    // Create a new voting with given identifier, title, description, times, and NFT contract
    function createVoting(
        string memory identifier,
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        address nftContract
    ) external {
        require(!votings[identifier].exists, "Voting identifier already exists");
        require(startTime < endTime, "Start time must be before end time");
        
        Voting storage v = votings[identifier];
        v.id = votingCounter;
        v.title = title;
        v.description = description;
        v.startTime = startTime;
        v.endTime = endTime;
        v.nftContract = nftContract;
        v.exists = true;

        activeVotingIndex[identifier] = activeIdentifiers.length;
        activeIdentifiers.push(identifier);

        votingCounter++;
    }

    // Vote for a candidate in a specific voting by identifier
    function vote(string memory identifier, string memory candidate) external {
        Voting storage v = votings[identifier];
        require(v.exists, "Voting does not exist");
        require(block.timestamp >= v.startTime, "Voting has not started yet");
        require(block.timestamp <= v.endTime, "Voting has already ended");

        // Check NFT ownership
        require(IERC721(v.nftContract).balanceOf(msg.sender) > 0, "Must own NFT to vote");
        // Check if already voted
        require(!v.voted[msg.sender], "Address has already voted");
        
        // Check candidate exists
        bool found = false;
        for (uint256 i = 0; i < v.candidates.length; i++) {
            if (keccak256(bytes(v.candidates[i])) == keccak256(bytes(candidate))) {
                found = true;
                break;
            }
        }
        require(found, "Candidate does not exist");

        // Record vote
        v.votes[candidate]++;
        v.voted[msg.sender] = true;
    }

    // Add a candidate to an existing voting
    function addCandidate(string memory identifier, string memory candidate) external {
        Voting storage v = votings[identifier];
        require(v.exists, "Voting does not exist");
        
        // Ensure candidate not already added
        for (uint256 i = 0; i < v.candidates.length; i++) {
            require(
                keccak256(bytes(v.candidates[i])) != keccak256(bytes(candidate)),
                "Candidate already exists"
            );
        }
        v.candidates.push(candidate);
        // Initial votes default to 0 (mapping default)
    }

    // Delete a candidate from an existing voting
    function deleteCandidate(string memory identifier, string memory candidate) external {
        Voting storage v = votings[identifier];
        require(v.exists, "Voting does not exist");

        uint256 index = v.candidates.length; // invalid index
        for (uint256 i = 0; i < v.candidates.length; i++) {
            if (keccak256(bytes(v.candidates[i])) == keccak256(bytes(candidate))) {
                index = i;
                break;
            }
        }
        require(index < v.candidates.length, "Candidate not found");

        // Remove candidate by swapping with last and popping
        v.candidates[index] = v.candidates[v.candidates.length - 1];
        v.candidates.pop();
        // Reset votes for candidate
        delete v.votes[candidate];
    }

    // Delete an entire voting
    function deleteVoting(string memory identifier) external {
        Voting storage v = votings[identifier];
        require(v.exists, "Voting does not exist");

        // Remove from activeIdentifiers array
        uint256 index = activeVotingIndex[identifier];
        string memory lastId = activeIdentifiers[activeIdentifiers.length - 1];
        activeIdentifiers[index] = lastId;
        activeVotingIndex[lastId] = index;
        activeIdentifiers.pop();
        delete activeVotingIndex[identifier];

        // Mark voting as non-existent
        v.exists = false;
        votingCounter--;
        // Note: Data in mappings remains but is inaccessible since exists is false
    }

    // Get vote count for a specific candidate in a voting
    function getVotes(string memory identifier, string memory candidate) external view returns (uint256) {
        Voting storage v = votings[identifier];
        require(v.exists, "Voting does not exist");

        // Check candidate exists
        bool found = false;
        for (uint256 i = 0; i < v.candidates.length; i++) {
            if (keccak256(bytes(v.candidates[i])) == keccak256(bytes(candidate))) {
                found = true;
                break;
            }
        }
        require(found, "Candidate does not exist");
        return v.votes[candidate];
    }

    // Get list of candidates for a voting
    function getCandidates(string memory identifier) external view returns (string[] memory) {
        Voting storage v = votings[identifier];
        require(v.exists, "Voting does not exist");
        return v.candidates;
    }

    // Check if a given address has voted in a voting
    function hasVoterVoted(string memory identifier, address user) external view returns (bool) {
        Voting storage v = votings[identifier];
        require(v.exists, "Voting does not exist");
        return v.voted[user];
    }

    // Get voting details: title, description, NFT contract address
    function getVotingDetails(string memory identifier) external view returns (
        string memory title,
        string memory description,
        address nftContract
    ) {
        Voting storage v = votings[identifier];
        require(v.exists, "Voting does not exist");
        return (v.title, v.description, v.nftContract);
    }

    // Get start time of a voting
    function getStartDate(string memory identifier) external view returns (uint256) {
        Voting storage v = votings[identifier];
        require(v.exists, "Voting does not exist");
        return v.startTime;
    }

    // Get end time of a voting
    function getEndDate(string memory identifier) external view returns (uint256) {
        Voting storage v = votings[identifier];
        require(v.exists, "Voting does not exist");
        return v.endTime;
    }

    // Get list of all ongoing (active) voting identifiers
    function getOngoingVotings() external view returns (string[] memory) {
        return activeIdentifiers;
    }

    // Get all candidate names and vote counts for a voting
    function getVotingData(string memory identifier) external view returns (
        string[] memory candidates,
        uint256[] memory votesCount
    ) {
        Voting storage v = votings[identifier];
        require(v.exists, "Voting does not exist");

        uint256 candidateCount = v.candidates.length;
        candidates = new string[](candidateCount);
        votesCount = new uint256[](candidateCount);

        for (uint256 i = 0; i < candidateCount; i++) {
            candidates[i] = v.candidates[i];
            votesCount[i] = v.votes[v.candidates[i]];
        }
        return (candidates, votesCount);
    }
}