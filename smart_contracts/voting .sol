// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC721 {
    function balanceOf(address owner) external view returns (uint256);
}

contract ChainBallot {
    address public owner;
    uint256 public activeVotingCount;
    string[] private activeVotingIds;
    mapping(string => uint256) private activeVotingIndex;

    struct Voting {
        string description;
        string[] candidates;
        mapping(string => uint256) votes;
        mapping(address => bool) voted;
        uint256 startDate;
        uint256 endDate;
        address creator;
        address nftContract;
        bool exists;
    }

    mapping(string => Voting) private votings;

    constructor() {
        owner = msg.sender;
    }

    function createVoting(
        string memory _id,
        string memory _description,
        string[] memory _candidates,
        uint256 _startDate,
        uint256 _endDate,
        address _nftContract
    ) external {
        require(bytes(_id).length > 0, "ID cannot be empty");
        require(!votings[_id].exists, "Voting ID already exists");
        require(_endDate > _startDate, "End date must be after start date");
        require(_candidates.length > 0, "At least one candidate required");
        require(_nftContract != address(0), "NFT contract address cannot be zero");

        Voting storage v = votings[_id];
        v.description = _description;
        v.startDate = _startDate;
        v.endDate = _endDate;
        v.creator = msg.sender;
        v.nftContract = _nftContract;
        v.exists = true;

        for (uint256 i = 0; i < _candidates.length; i++) {
            string memory candidate = _candidates[i];
            require(bytes(candidate).length > 0, "Candidate name cannot be empty");
            for (uint256 j = 0; j < i; j++) {
                require(
                    keccak256(abi.encodePacked(candidate)) != keccak256(abi.encodePacked(_candidates[j])),
                    "Duplicate candidates not allowed"
                );
            }
            v.candidates.push(candidate);
            v.votes[candidate] = 0;
        }

        activeVotingIds.push(_id);
        activeVotingIndex[_id] = activeVotingIds.length;
        activeVotingCount++;
    }

    function vote(string memory _id, string memory _candidate) external {
        Voting storage v = votings[_id];
        require(v.exists, "Voting does not exist");
        require(block.timestamp >= v.startDate, "Voting not started");
        require(block.timestamp <= v.endDate, "Voting ended");
        require(!v.voted[msg.sender], "Already voted");
        require(IERC721(v.nftContract).balanceOf(msg.sender) > 0, "Must own NFT to vote");

        bool found = false;
        for (uint256 i = 0; i < v.candidates.length; i++) {
            if (keccak256(abi.encodePacked(v.candidates[i])) == keccak256(abi.encodePacked(_candidate))) {
                found = true;
                break;
            }
        }
        require(found, "Candidate not found");

        v.votes[_candidate]++;
        v.voted[msg.sender] = true;
    }

    function addCandidate(string memory _id, string memory _candidate) external {
        Voting storage v = votings[_id];
        require(v.exists, "Voting does not exist");
        require(block.timestamp <= v.endDate, "Voting ended");
        require(bytes(_candidate).length > 0, "Candidate empty");
        require(msg.sender == v.creator || msg.sender == owner, "Unauthorized");

        for (uint256 i = 0; i < v.candidates.length; i++) {
            require(
                keccak256(abi.encodePacked(v.candidates[i])) != keccak256(abi.encodePacked(_candidate)),
                "Candidate already exists"
            );
        }

        v.candidates.push(_candidate);
        v.votes[_candidate] = 0;
    }

    function deleteCandidate(string memory _id, string memory _candidate) external {
        Voting storage v = votings[_id];
        require(v.exists, "Voting does not exist");
        require(block.timestamp <= v.endDate, "Voting ended");
        require(msg.sender == v.creator || msg.sender == owner, "Unauthorized");

        uint256 indexToRemove = type(uint256).max;
        for (uint256 i = 0; i < v.candidates.length; i++) {
            if (keccak256(abi.encodePacked(v.candidates[i])) == keccak256(abi.encodePacked(_candidate))) {
                indexToRemove = i;
                break;
            }
        }
        require(indexToRemove != type(uint256).max, "Candidate not found");
        require(v.votes[_candidate] == 0, "Candidate already has votes");

        uint256 lastIndex = v.candidates.length - 1;
        if (indexToRemove != lastIndex) {
            v.candidates[indexToRemove] = v.candidates[lastIndex];
        }
        v.candidates.pop();
        delete v.votes[_candidate];
    }

    function deleteVoting(string memory _id) external {
        Voting storage v = votings[_id];
        require(v.exists, "Voting does not exist");
        require(msg.sender == v.creator || msg.sender == owner, "Unauthorized");

        uint256 index = activeVotingIndex[_id];
        require(index != 0, "Not active");

        uint256 arrayIndex = index - 1;
        uint256 lastIndex = activeVotingIds.length - 1;
        if (arrayIndex != lastIndex) {
            string memory lastId = activeVotingIds[lastIndex];
            activeVotingIds[arrayIndex] = lastId;
            activeVotingIndex[lastId] = index;
        }
        activeVotingIds.pop();
        activeVotingIndex[_id] = 0;
        activeVotingCount--;

        v.exists = false;
    }

    function getVotes(string memory _id) external view returns (uint256[] memory) {
        Voting storage v = votings[_id];
        require(v.exists, "Voting does not exist");

        uint256 length = v.candidates.length;
        uint256[] memory voteCounts = new uint256[](length);
        for (uint256 i = 0; i < length; i++) {
            voteCounts[i] = v.votes[v.candidates[i]];
        }
        return voteCounts;
    }

    function getCandidates(string memory _id) external view returns (string[] memory) {
        Voting storage v = votings[_id];
        require(v.exists, "Voting does not exist");
        return v.candidates;
    }

    function hasVoterVoted(string memory _id, address _voter) external view returns (bool) {
        Voting storage v = votings[_id];
        require(v.exists, "Voting does not exist");
        return v.voted[_voter];
    }

    function getVotingDetails(string memory _id) external view returns (
        string memory description,
        uint256 startDate,
        uint256 endDate,
        address nftContract,
        bool isActive
    ) {
        Voting storage v = votings[_id];
        require(v.exists, "Voting does not exist");
        return (v.description, v.startDate, v.endDate, v.nftContract, block.timestamp >= v.startDate && block.timestamp <= v.endDate);
    }

    function getOngoingVotings() external view returns (string[] memory) {
        uint256 total = activeVotingIds.length;
        string[] memory temp = new string[](total);
        uint256 count = 0;

        for (uint256 i = 0; i < total; i++) {
            Voting storage v = votings[activeVotingIds[i]];
            if (v.exists && block.timestamp >= v.startDate && block.timestamp <= v.endDate) {
                temp[count] = activeVotingIds[i];
                count++;
            }
        }

        string[] memory ongoing = new string[](count);
        for (uint256 i = 0; i < count; i++) {
            ongoing[i] = temp[i];
        }
        return ongoing;
    }
}
