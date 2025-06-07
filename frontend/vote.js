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
    {"inputs": [{"internalType": "string", "name": "identifier", "type": "string"}, {"internalType": "address", "name": "user", "type": "address"}], "name": "hasVoterVoted", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view", "type": "function"},
    {"inputs": [
        {"internalType": "string", "name": "identifier", "type": "string"},
        {"internalType": "string", "name": "candidate", "type": "string"}
    ], "name": "vote", "outputs": [], "stateMutability": "nonpayable", "type": "function"}
];
const NFTFactoryABI = [
    {"inputs": [{"internalType": "string", "name": "identifier", "type": "string"}], "name": "getUsersWithNFTs", "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "string", "name": "identifier", "type": "string"}], "name": "hasReceived", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "string", "name": "identifier", "type": "string"}], "name": "identifierToOwner", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "string", "name": "identifier", "type": "string"}], "name": "registerUser", "outputs": [], "stateMutability": "nonpayable", "type": "function"}
];
const VotingAddress = "0xcd7d674128e9218bd0eafc76060189ea0caf8ff0";
const NFTFactoryAddress = "0x74c06b5f6f1685dc0f6c02886f2b70c88736b0d9";

let web3, votingContract, nftFactoryContract, userAccount;

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

async function init() {
    web3 = new Web3(window.ethereum || new Web3.providers.HttpProvider('https://polygon-rpc.com'));
    votingContract = new web3.eth.Contract(VotingABI, VotingAddress);
    nftFactoryContract = new web3.eth.Contract(NFTFactoryABI, NFTFactoryAddress);

    let identifier = getQueryParam('id');
    if (!identifier) {
        document.getElementById('voting-details').innerHTML = '<div class="error-message">No identifier provided.</div>';
        return;
    }

    // Connect wallet if not already
    if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAccount = accounts[0];
    } else {
        document.getElementById('voting-details').innerHTML = '<div class="error-message">Please install MetaMask to vote.</div>';
        return;
    }

    // Fetch all sections in parallel for speed
    await Promise.all([
        renderVotingDetails(identifier),
        renderCandidatesVoting(identifier),
        renderNFTOwners(identifier)
    ]);
}

async function renderVotingDetails(identifier) {
    try {
        let title = '', description = '', nftContract = '', start = '', end = '', creatorAddr = '';
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
        const startTime = start ? new Date(Number(start) * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '';
        const endTime = end ? new Date(Number(end) * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '';
        document.getElementById('voting-details').innerHTML = `
            <p><b>Title:</b> ${title}</p>
            <p><b>Identifier:</b> ${identifier}</p>
            <p><b>Creator:</b> <span class="contract-address">${creatorAddr}</span></p>
            <p><b>Description:</b> ${description}</p>
            <p><b>NFT Contract:</b> <span class="contract-address">${nftContract}</span></p>
            <p><b>Start Time:</b> ${startTime} (IST)</p>
            <p><b>End Time:</b> ${endTime} (IST)</p>
        `;
    } catch (e) {
        document.getElementById('voting-details').innerHTML = '<div class="error-message">Could not fetch voting details.</div>';
    }
}

async function renderCandidatesVoting(identifier) {
    const candidatesList = document.getElementById('candidates-list');
    const voteActions = document.getElementById('vote-actions');
    const voteStatus = document.getElementById('vote-status');
    candidatesList.innerHTML = '';
    voteActions.innerHTML = '';
    voteStatus.innerHTML = '';
    let candidates = [], votes = [];
    try {
        const votingData = await votingContract.methods.getVotingData(identifier).call();
        candidates = votingData[0];
        votes = votingData[1];
    } catch (e) {
        candidatesList.innerHTML = '<div class="error-message">No candidates found for this voting.</div>';
        return;
    }

    // Always get the latest userAccount from MetaMask
    if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
            userAccount = accounts[0];
        }
    }

    // Check voting eligibility
    let hasVoted = false, hasNFT = false;
    try {
        hasVoted = await votingContract.methods.hasVoterVoted(identifier, userAccount).call();
    } catch (e) {}
    try {
        hasNFT = await nftFactoryContract.methods.hasReceived(identifier, userAccount).call();
    } catch (e) {}

    // Render candidates with radio buttons and votes
    candidates.forEach((c, i) => {
        const row = document.createElement('div');
        row.className = 'candidate-vote-row';
        row.innerHTML = `
            <label style="display:flex;align-items:center;gap:1.2rem;font-size:1.08rem;">
                <input type="radio" name="candidate" value="${c}" style="margin-right:0.7rem;" ${hasVoted ? 'disabled' : ''}>
                <span style="min-width:120px;display:inline-block;">${c}</span>
                <span style="font-weight:bold;">${votes[i]}</span>
            </label>
        `;
        candidatesList.appendChild(row);
    });

    // Voting logic: if hasVoted, show message and hide both buttons
    if (hasVoted) {
        voteActions.innerHTML = '<div class="error-message" style="font-weight:bold;">You have already voted. Only one vote allowed per user.</div>';
    } else {
        voteActions.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;gap:0.7rem;">
                <button id="vote-btn" class="btn-result" style="width:220px;">Vote</button>
                <div style="font-size:0.98rem;color:#2F4F4F;margin-bottom:0.2rem;"><br>Click on <b>"Get Access for Voting"</b> to request access for voting NFT if you don't have one.</div>
                <button id="get-access-btn" class="btn-vote-now" style="width:170px;font-size:0.97rem;">Get Access for Voting</button>
            </div>
        `;
    }

    // Vote button handler
    if (!hasVoted) {
        document.getElementById('vote-btn').onclick = async (e) => {
            e.preventDefault();
            const selected = document.querySelector('input[name="candidate"]:checked');
            if (!selected) {
                voteStatus.innerHTML = '<div class="error-message">Please select a candidate to vote.</div>';
                return;
            }
            // Find the exact candidate string from the candidates array
            const candidateName = candidates.find(c => c === selected.value);
            if (!candidateName) {
                voteStatus.innerHTML = '<div class="error-message">Invalid candidate selected.</div>';
                return;
            }
            voteStatus.innerHTML = 'Processing vote...';
            try {
                // Debug: log types and values
                console.log('identifier:', identifier, typeof identifier);
                console.log('candidateName:', candidateName, typeof candidateName);
                console.log('userAccount:', userAccount, typeof userAccount);
                // Ensure both are strings
                const idStr = String(identifier);
                const candStr = String(candidateName);
                // Use same gas logic as get access button
                const gasPrice = await web3.eth.getGasPrice();
                await votingContract.methods.vote(idStr, candStr).send({ from: userAccount, gas: 300000, gasPrice });
                voteStatus.innerHTML = '<span style="color:#27ae60;font-weight:bold;">Vote successful!</span>';
                setTimeout(() => window.location.reload(), 1500);
            } catch (err) {
                voteStatus.innerHTML = `<span style="color:#e74c3c;">Error: ${err.message || 'Transaction failed.'}</span>`;
                console.error('Vote error:', err);
            }
        };
        document.getElementById('get-access-btn').onclick = async (e) => {
            e.preventDefault();
            voteStatus.innerHTML = 'Processing access...';
            voteStatus.style.color = '#3498db';
            try {
                if (!window.ethereum) {
                    voteStatus.innerHTML = '<span style="color:#e74c3c;">MetaMask not found. Please install MetaMask.</span>';
                    return;
                }
                // Ensure wallet is connected
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const account = accounts[0];
                userAccount = account;
                // Ensure correct network (Polygon Mainnet, chainId: 137)
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                if (chainId !== '0x89') {
                    voteStatus.innerHTML = '<span style="color:#e74c3c;">Please switch to the Polygon network in MetaMask.</span>';
                    return;
                }
                // Get current gas price
                const gasPrice = await web3.eth.getGasPrice();
                // Send transaction to registerUser (only identifier)
                await nftFactoryContract.methods.registerUser(identifier).send({
                    from: account,
                    gas: 300000,
                    gasPrice: gasPrice
                });
                voteStatus.innerHTML = '<span style="color:#27ae60;font-weight:bold;">Access requested! Please wait for approval and again after some time.</span>';
                setTimeout(() => renderCandidatesVoting(identifier), 4000);
            } catch (err) {
                let msg = 'Transaction failed. Please check if you are on the correct network and have enough gas.';
                if (err && err.message) {
                    if (err.message.includes('User denied')) {
                        msg = 'Transaction was rejected by user.';
                    } else if (err.message.includes('insufficient funds')) {
                        msg = 'Insufficient funds for gas. Please add more MATIC to your wallet.';
                    } else if (err.message.includes('network') || err.message.includes('chain')) {
                        msg = 'Please switch to the Polygon network in MetaMask.';
                    } else {
                        msg = err.message;
                    }
                }
                voteStatus.innerHTML = `<span style="color:#e74c3c;">Error: ${msg}</span>`;
            }
        };
    }
}


async function renderNFTOwners(identifier) {
    let owners = [];
    try {
        owners = await nftFactoryContract.methods.getUsersWithNFTs(identifier).call();
    } catch (e) { owners = []; }
    const ownersList = document.getElementById('nft-owners-list');
    ownersList.innerHTML = '';
    if (!owners || owners.length === 0) {
        ownersList.innerHTML = '<div class="error-message">No NFT owners found for this voting.</div>';
        return;
    }
    for (const addr of owners) {
        let voted = false;
        try {
            voted = await votingContract.methods.hasVoterVoted(identifier, addr).call();
        } catch (e) {}
        const ownerCard = document.createElement('div');
        ownerCard.className = 'voting-card nft-owner-card';
        ownerCard.innerHTML = `<span class="contract-address">${addr}</span> <span class="status-icon" title="${voted ? 'Voted' : 'Not Voted'}">${voted ? '<i class=\'fas fa-check-circle\'></i>' : '<i class=\'fas fa-times-circle\'></i>'}</span>`;
        ownersList.appendChild(ownerCard);
    }
}

// Wallet connect, profile, disconnect logic (same as other pages)
document.getElementById('profile-btn').addEventListener('click', () => {
    window.location.href = 'profile.html';
});
document.getElementById('disconnect-btn').addEventListener('click', () => {
    localStorage.removeItem('connectedWallet');
    window.location.reload();
});

// --- Wallet Connect Logic (from result.js) ---
function handleWalletConnected(account) {
    const connectButton = document.getElementById('connect-wallet');
    const buttonText = connectButton.querySelector('span');
    buttonText.textContent = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
    connectButton.style.backgroundColor = '#27ae60';
    localStorage.setItem('connectedWallet', account);
}

window.addEventListener('DOMContentLoaded', () => {
    const connectButton = document.getElementById('connect-wallet');
    const buttonText = connectButton.querySelector('span');
    const storedAccount = localStorage.getItem('connectedWallet');
    if (storedAccount) {
        userAccount = storedAccount;
        buttonText.textContent = `${storedAccount.substring(0, 6)}...${storedAccount.substring(storedAccount.length - 4)}`;
        connectButton.style.backgroundColor = '#27ae60';
    } else {
        buttonText.textContent = 'Connect Wallet';
        connectButton.style.backgroundColor = '#3498db';
    }
});

document.getElementById('connect-wallet').addEventListener('click', async () => {
    if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAccount = accounts[0];
        handleWalletConnected(userAccount);
    } else {
        alert('Please install MetaMask to connect your wallet');
    }
});

window.addEventListener('load', init); 