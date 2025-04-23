// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC721 {
    function balanceOf(address owner) external view returns (uint256);
}

contract ChainBallot {
    struct Voting {
        string title;
        string[] candidates;
        mapping(string => uint256) votes;
        mapping(address => bool) hasVoted;
        uint256 startTime;
        uint256 endTime;
        address nftAddress;
        address creator;
        bool exists;
        bool deleted;
        mapping(string => bool) isCandidate;
    }

    uint256 public votingCounter;
    mapping(uint256 => Voting) private votings;

    // ✅ Clear transaction messages via events
    event VotingCreated(uint256 indexed votingId, string message);
    event Voted(uint256 indexed votingId, address voter, string candidate, string message);
    event CandidateAdded(uint256 indexed votingId, string candidate, string message);
    event CandidateDeleted(uint256 indexed votingId, string candidate, string message);
    event VotingDeleted(uint256 indexed votingId, string message);

    modifier votingExists(uint256 votingId) {
        require(votings[votingId].exists, "Voting does not exist");
        require(!votings[votingId].deleted, "Voting was deleted by the creator");
        _;
    }

    modifier onlyDuringVoting(uint256 votingId) {
        require(block.timestamp >= votings[votingId].startTime, "Voting has not started");
        require(block.timestamp <= votings[votingId].endTime, "Voting has ended");
        _;
    }

    modifier onlyCreator(uint256 votingId) {
        require(msg.sender == votings[votingId].creator, "Not the creator of this voting");
        _;
    }

    function createVoting(
        string memory _title,
        string[] memory _candidates,
        uint256 _startTime,
        uint256 _endTime,
        address _nftAddress
    ) public {
        require(_startTime < _endTime, "Start must be before end");
        require(_candidates.length >= 2, "At least 2 candidates required");
        require(_nftAddress != address(0), "Invalid NFT address");

        Voting storage newVoting = votings[votingCounter];
        newVoting.title = _title;
        newVoting.startTime = _startTime;
        newVoting.endTime = _endTime;
        newVoting.nftAddress = _nftAddress;
        newVoting.creator = msg.sender;
        newVoting.exists = true;
        newVoting.deleted = false;

        for (uint256 i = 0; i < _candidates.length; i++) {
            newVoting.candidates.push(_candidates[i]);
            newVoting.votes[_candidates[i]] = 0;
            newVoting.isCandidate[_candidates[i]] = true;
        }

        emit VotingCreated(votingCounter, "Voting created successfully");
        votingCounter++;
    }

    function vote(uint256 votingId, string memory candidate)
        public
        votingExists(votingId)
        onlyDuringVoting(votingId)
    {
        Voting storage v = votings[votingId];
        require(!v.hasVoted[msg.sender], "Already voted");
        require(v.isCandidate[candidate], "Invalid candidate");

        IERC721 nft = IERC721(v.nftAddress);
        require(nft.balanceOf(msg.sender) > 0, "You must own the NFT to vote");

        v.votes[candidate]++;
        v.hasVoted[msg.sender] = true;

        emit Voted(votingId, msg.sender, candidate, "Vote successful");
    }

    function addCandidate(uint256 votingId, string memory candidate)
        public
        votingExists(votingId)
        onlyCreator(votingId)
    {
        Voting storage v = votings[votingId];
        require(!v.isCandidate[candidate], "Candidate already exists");

        v.candidates.push(candidate);
        v.votes[candidate] = 0;
        v.isCandidate[candidate] = true;

        emit CandidateAdded(votingId, candidate, "Candidate added successfully");
    }

    function deleteCandidate(uint256 votingId, string memory candidate)
        public
        votingExists(votingId)
        onlyCreator(votingId)
    {
        Voting storage v = votings[votingId];
        require(v.isCandidate[candidate], "Candidate does not exist");

        v.isCandidate[candidate] = false;

        for (uint256 i = 0; i < v.candidates.length; i++) {
            if (keccak256(bytes(v.candidates[i])) == keccak256(bytes(candidate))) {
                v.candidates[i] = v.candidates[v.candidates.length - 1];
                v.candidates.pop();
                break;
            }
        }

        emit CandidateDeleted(votingId, candidate, "Candidate deleted successfully");
    }

    function deleteVoting(uint256 votingId)
        public
        onlyCreator(votingId)
    {
        require(votings[votingId].exists, "Voting does not exist");
        require(!votings[votingId].deleted, "Voting already deleted");

        votings[votingId].deleted = true;

        emit VotingDeleted(votingId, "Voting deleted successfully");
    }

    function getVotes(uint256 votingId, string memory candidate)
        public
        view
        votingExists(votingId)
        returns (uint256)
    {
        return votings[votingId].votes[candidate];
    }

    function getCandidates(uint256 votingId)
        public
        view
        votingExists(votingId)
        returns (string[] memory)
    {
        return votings[votingId].candidates;
    }

    function hasVoterVoted(uint256 votingId, address voter)
        public
        view
        votingExists(votingId)
        returns (bool)
    {
        return votings[votingId].hasVoted[voter];
    }

    function getVotingDetails(uint256 votingId)
        public
        view
        votingExists(votingId)
        returns (string memory title, address nftAddress, uint256 startTime, uint256 endTime, address creator)
    {
        Voting storage v = votings[votingId];
        return (v.title, v.nftAddress, v.startTime, v.endTime, v.creator);
    }

    function getStartDate(uint256 votingId)
        public
        view
        votingExists(votingId)
        returns (uint256)
    {
        return votings[votingId].startTime;
    }

    function getEndDate(uint256 votingId)
        public
        view
        votingExists(votingId)
        returns (uint256)
    {
        return votings[votingId].endTime;
    }
}