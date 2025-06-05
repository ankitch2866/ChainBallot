// Contract ABIs and addresses
const VotingABI = [
    {"inputs": [{"internalType": "string", "name": "identifier", "type": "string"}], "name": "getVotingDetails", "outputs": [
        {"internalType": "string", "name": "title", "type": "string"},
        {"internalType": "string", "name": "description", "type": "string"},
        {"internalType": "address", "name": "nftContract", "type": "address"}
    ], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "string", "name": "identifier", "type": "string"}], "name": "getStartDate", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "string", "name": "identifier", "type": "string"}], "name": "getEndDate", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "string", "name": "identifier", "type": "string"}], "name": "getVotingData", "outputs": [
        {"internalType": "string[]", "name": "candidates", "type": "string[]"},
        {"internalType": "uint256[]", "name": "votesCount", "type": "uint256[]"}
    ], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "string", "name": "identifier", "type": "string"}], "name": "getCandidates", "outputs": [{"internalType": "string[]", "name": "", "type": "string[]"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "string", "name": "identifier", "type": "string"}, {"internalType": "address", "name": "user", "type": "address"}], "name": "hasVoterVoted", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view", "type": "function"}
];
const NFTFactoryABI = [
    {"inputs": [{"internalType": "string", "name": "identifier", "type": "string"}], "name": "getUsersWithNFTs", "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "string", "name": "identifier", "type": "string"}], "name": "getContractOwner", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "string", "name": "identifier", "type": "string"}], "name": "identifierToOwner", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"}
];
const VotingAddress = "0xcd7d674128e9218bd0eafc76060189ea0caf8ff0";
const NFTFactoryAddress = "0x74c06b5f6f1685dc0f6c02886f2b70c88736b0d9";

let web3, votingContract, nftFactoryContract;

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

async function promptForIdentifier() {
    let identifier = '';
    while (!identifier) {
        identifier = prompt('Enter the voting identifier to view results:');
        if (identifier === null) return null; // user cancelled
        identifier = identifier.trim();
    }
    return identifier;
}

async function init() {
    web3 = new Web3(new Web3.providers.HttpProvider('https://polygon-rpc.com'));
    votingContract = new web3.eth.Contract(VotingABI, VotingAddress);
    nftFactoryContract = new web3.eth.Contract(NFTFactoryABI, NFTFactoryAddress);

    let identifier = getQueryParam('id');
    if (!identifier) {
        identifier = await promptForIdentifier();
        if (!identifier) {
            document.getElementById('result-header').innerHTML = '<h2>Voting Result</h2><p>No identifier provided.</p>';
            return;
        }
    }
    await loadResult(identifier);
}

async function loadResult(identifier) {
    try {
        // 1. Get candidates and votes
        let candidates = [], votes = [];
        try {
            const votingData = await votingContract.methods.getVotingData(identifier).call();
            candidates = votingData[0];
            votes = votingData[1];
        } catch (e) {
            document.getElementById('result-header').innerHTML = '<h2>Voting Result</h2><p class="error-message">Voting not found for identifier: ' + identifier + '</p>';
            return;
        }
        // 2. Find winner
        let maxVotes = -1, winnerIdx = -1, isTie = false;
        let maxCount = 0;
        for (let i = 0; i < votes.length; i++) {
            if (Number(votes[i]) > maxVotes) {
                maxVotes = Number(votes[i]);
                winnerIdx = i;
                maxCount = 1;
            } else if (Number(votes[i]) === maxVotes) {
                maxCount++;
            }
        }
        isTie = (maxVotes === 0 || maxCount > 1);
        // 3. Show Voting Result
        document.getElementById('winner-section').style.display = 'block';
        if (!candidates || candidates.length === 0) {
            document.getElementById('winner-name').innerHTML = 'No winner (no candidates)';
            document.getElementById('winner-animation').innerHTML = '';
        } else if (isTie) {
            document.getElementById('winner-name').innerHTML = `<b>Tie</b> (No winner)`;
            document.getElementById('winner-animation').innerHTML = `<div class="winner-crown"><i class="fas fa-balance-scale fa-3x" style="color:#FFD700; animation: shine 1.5s infinite alternate;"></i></div>`;
        } else {
            document.getElementById('winner-name').innerHTML = `<b>${candidates[winnerIdx]}</b> with <b>${votes[winnerIdx]}</b> votes!`;
            document.getElementById('winner-animation').innerHTML = `<div class="winner-crown"><i class="fas fa-crown fa-3x" style="color:#FFD700; animation: shine 1.5s infinite alternate;"></i></div>`;
        }
        // 4. Show Candidates & Votes
        const candidatesList = document.getElementById('candidates-list');
        candidatesList.innerHTML = '';
        if (!candidates || candidates.length === 0) {
            candidatesList.innerHTML = '<div class="error-message">No candidates found for this voting.</div>';
        } else {
            candidates.forEach((c, i) => {
                const isWinner = !isTie && i === winnerIdx;
                const card = document.createElement('div');
                card.className = 'voting-card candidate-card';
                card.style.background = isWinner ? 'linear-gradient(135deg, rgba(46,204,113,0.15), rgba(39,174,96,0.12))' : 'linear-gradient(135deg, rgba(231,76,60,0.15), rgba(192,57,43,0.12))';
                card.innerHTML = `<h3>${c}</h3><p>Votes: <b>${votes[i]}</b></p>`;
                if (isWinner) card.innerHTML += '<span class="status status-ongoing">Winner</span>';
                candidatesList.appendChild(card);
            });
        }
        // 5. Voting Details
        let title = '', description = '', nftContract = '', start = '', end = '', creatorAddr = '';
        try {
            const details = await votingContract.methods.getVotingDetails(identifier).call();
            if (Array.isArray(details)) {
                [title, description, nftContract] = details;
            } else {
                title = details.title;
                description = details.description;
                nftContract = details.nftContract;
            }
            start = await votingContract.methods.getStartDate(identifier).call();
            end = await votingContract.methods.getEndDate(identifier).call();
            creatorAddr = await nftFactoryContract.methods.identifierToOwner(identifier).call();
        } catch (e) {
            document.getElementById('voting-details').innerHTML = '<div class="error-message">Could not fetch voting details.</div>';
        }
        const startTime = start ? new Date(Number(start) * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '';
        const endTime = end ? new Date(Number(end) * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '';
        document.getElementById('creator-name').innerHTML = `<b>Creator:</b> <span class="contract-address">${creatorAddr}</span>`;
        document.getElementById('voting-details').innerHTML = `
            <p><b>Title:</b> ${title}</p>
            <p><b>Identifier:</b> ${identifier}</p>
            <p><b>Description:</b> ${description}</p>
            <p><b>NFT Contract:</b> <span class="contract-address">${nftContract}</span></p>
            <p><b>Start Time:</b> ${startTime} (IST)</p>
            <p><b>End Time:</b> ${endTime} (IST)</p>
        `;
        // 6. NFT Owners & Voting Status
        let owners = [];
        try {
            owners = await nftFactoryContract.methods.getUsersWithNFTs(identifier).call();
        } catch (e) {
            owners = [];
        }
        const ownersList = document.getElementById('nft-owners-list');
        ownersList.innerHTML = '';
        if (!owners || owners.length === 0) {
            ownersList.innerHTML = '<div class="error-message">No NFT owners found for this voting.</div>';
        } else {
            for (const addr of owners) {
                let voted = false;
                try {
                    voted = await votingContract.methods.hasVoterVoted(identifier, addr).call();
                } catch (e) {}
                const ownerCard = document.createElement('div');
                ownerCard.className = 'voting-card nft-owner-card';
                ownerCard.innerHTML = `<span class="contract-address">${addr}</span> <span style="float:right;">${voted ? '<i class=\'fas fa-check-circle\' style=\'color:#27ae60;\'></i>' : '<i class=\'fas fa-times-circle\' style=\'color:#e74c3c;\'></i>'}</span>`;
                ownersList.appendChild(ownerCard);
            }
        }
    } catch (err) {
        document.getElementById('result-header').innerHTML = '<h2>Voting Result</h2><p class="error-message">Error loading result: ' + err.message + '</p>';
    }
}

function handleWalletConnected(account) {
    const connectButton = document.getElementById('connect-wallet');
    const buttonText = connectButton.querySelector('span');
    buttonText.textContent = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
    connectButton.style.backgroundColor = '#27ae60';
    localStorage.setItem('connectedWallet', account);
}

// On page load, restore wallet if present
window.addEventListener('DOMContentLoaded', () => {
    const connectButton = document.getElementById('connect-wallet');
    const buttonText = connectButton.querySelector('span');
    const storedAccount = localStorage.getItem('connectedWallet');
    if (storedAccount) {
        buttonText.textContent = `${storedAccount.substring(0, 6)}...${storedAccount.substring(storedAccount.length - 4)}`;
        connectButton.style.backgroundColor = '#27ae60';
    } else {
        buttonText.textContent = 'Connect Wallet';
        connectButton.style.backgroundColor = '#3498db';
    }
});

// Connect wallet button handler
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('connect-wallet').addEventListener('click', async () => {
        if (window.ethereum) {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            handleWalletConnected(accounts[0]);
        } else {
            alert('Please install MetaMask to connect your wallet');
        }
    });
});

// Profile & Disconnect button handlers
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('profile-btn').addEventListener('click', () => {
        window.location.href = 'profile.html';
    });
    document.getElementById('disconnect-btn').addEventListener('click', () => {
        localStorage.removeItem('connectedWallet');
        window.location.reload();
    });
    init();
});

// Animation for winner crown
const style = document.createElement('style');
style.innerHTML = `
@keyframes shine {
    0% { filter: drop-shadow(0 0 0px #FFD700); }
    100% { filter: drop-shadow(0 0 16px #FFD700); }
}
`;
document.head.appendChild(style); 