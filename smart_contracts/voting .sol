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
        address creator; // <-- NEW
        bool exists;
        string[] candidates;
        mapping(address => bool) voted;
        mapping(string => uint256) votes;
    }

    mapping(string => Voting) private votings;
    string[] private activeIdentifiers;
    mapping(string => uint256) private activeVotingIndex;
    uint256 public votingCounter;

    function createVoting(
        string memory identifier,
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        address nftContract,
        string[] memory initialCandidates // <-- NEW: accept candidates at creation
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
        v.creator = msg.sender; // <-- NEW
        v.exists = true;

        // Add initial candidates
        for (uint256 i = 0; i < initialCandidates.length; i++) {
            v.candidates.push(initialCandidates[i]);
        }

        activeVotingIndex[identifier] = activeIdentifiers.length;
        activeIdentifiers.push(identifier);

        votingCounter++;
    }

    function vote(string memory identifier, string memory candidate) external {
        Voting storage v = votings[identifier];
        require(v.exists, "Voting does not exist");
        require(block.timestamp >= v.startTime, "Voting has not started yet");
        require(block.timestamp <= v.endTime, "Voting has already ended");

        require(IERC721(v.nftContract).balanceOf(msg.sender) > 0, "Must own NFT to vote");
        require(!v.voted[msg.sender], "Address has already voted");
        
        bool found = false;
        for (uint256 i = 0; i < v.candidates.length; i++) {
            if (keccak256(bytes(v.candidates[i])) == keccak256(bytes(candidate))) {
                found = true;
                break;
            }
        }
        require(found, "Candidate does not exist");

        v.votes[candidate]++;
        v.voted[msg.sender] = true;
    }

    function addCandidate(string memory identifier, string memory candidate) external {
        Voting storage v = votings[identifier];
        require(v.exists, "Voting does not exist");
        require(msg.sender == v.creator, "Only creator can add candidates"); // <-- NEW
        
        for (uint256 i = 0; i < v.candidates.length; i++) {
            require(
                keccak256(bytes(v.candidates[i])) != keccak256(bytes(candidate)),
                "Candidate already exists"
            );
        }
        v.candidates.push(candidate);
    }

    function deleteCandidate(string memory identifier, string memory candidate) external {
        Voting storage v = votings[identifier];
        require(v.exists, "Voting does not exist");
        require(msg.sender == v.creator, "Only creator can delete candidates"); // <-- NEW

        uint256 index = v.candidates.length;
        for (uint256 i = 0; i < v.candidates.length; i++) {
            if (keccak256(bytes(v.candidates[i])) == keccak256(bytes(candidate))) {
                index = i;
                break;
            }
        }
        require(index < v.candidates.length, "Candidate not found");

        v.candidates[index] = v.candidates[v.candidates.length - 1];
        v.candidates.pop();
        delete v.votes[candidate];
    }

    function deleteVoting(string memory identifier) external {
        Voting storage v = votings[identifier];
        require(v.exists, "Voting does not exist");
        require(msg.sender == v.creator, "Only creator can delete voting"); // <-- NEW

        uint256 index = activeVotingIndex[identifier];
        string memory lastId = activeIdentifiers[activeIdentifiers.length - 1];
        activeIdentifiers[index] = lastId;
        activeVotingIndex[lastId] = index;
        activeIdentifiers.pop();
        delete activeVotingIndex[identifier];

        v.exists = false;
        votingCounter--;
    }

    function getVotes(string memory identifier, string memory candidate) external view returns (uint256) {
        Voting storage v = votings[identifier];
        require(v.exists, "Voting does not exist");

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

    function getCandidates(string memory identifier) external view returns (string[] memory) {
        Voting storage v = votings[identifier];
        require(v.exists, "Voting does not exist");
        return v.candidates;
    }

    function hasVoterVoted(string memory identifier, address user) external view returns (bool) {
        Voting storage v = votings[identifier];
        require(v.exists, "Voting does not exist");
        return v.voted[user];
    }

    function getVotingDetails(string memory identifier) external view returns (
        string memory title,
        string memory description,
        address nftContract
    ) {
        Voting storage v = votings[identifier];
        require(v.exists, "Voting does not exist");
        return (v.title, v.description, v.nftContract);
    }

    function getStartDate(string memory identifier) external view returns (uint256) {
        Voting storage v = votings[identifier];
        require(v.exists, "Voting does not exist");
        return v.startTime;
    }

    function getEndDate(string memory identifier) external view returns (uint256) {
        Voting storage v = votings[identifier];
        require(v.exists, "Voting does not exist");
        return v.endTime;
    }

    function getOngoingVotings() external view returns (string[] memory) {
        return activeIdentifiers;
    }

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