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
    {"inputs": [{"internalType": "string", "name": "identifier", "type": "string"}, {"internalType": "string", "name": "candidate", "type": "string"}], "name": "deleteCandidate", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"internalType": "string", "name": "identifier", "type": "string"}, {"internalType": "string", "name": "candidate", "type": "string"}], "name": "addCandidate", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"internalType": "string", "name": "identifier", "type": "string"}], "name": "deleteVoting", "outputs": [], "stateMutability": "nonpayable", "type": "function"}
];
const NFTFactoryABI = [
    {"inputs": [{"internalType": "string", "name": "identifier", "type": "string"}], "name": "getUsersWithNFTs", "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "string", "name": "identifier", "type": "string"}], "name": "fetchData", "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "string", "name": "identifier", "type": "string"}, {"internalType": "address", "name": "recipient", "type": "address"}], "name": "mintNFT", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"internalType": "string", "name": "identifier", "type": "string"}, {"internalType": "address[]", "name": "recipients", "type": "address[]"}], "name": "batchMintNFTs", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"internalType": "string", "name": "identifier", "type": "string"}], "name": "identifierToOwner", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"}
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
        document.getElementById('voting-details').innerHTML = '<div class="error-message">Please install MetaMask to edit voting.</div>';
        return;
    }

    // Always fetch all four sections after wallet connect
    await renderVotingDetails(identifier);
    await renderCandidatesSection(identifier);
    await renderRequestedUsersSection(identifier);
    await renderNFTOwnersSection(identifier);
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

async function renderCandidatesSection(identifier) {
    const candidatesList = document.getElementById('candidates-list');
    candidatesList.innerHTML = '';
    let candidates = [], votes = [];
    try {
        const votingData = await votingContract.methods.getVotingData(identifier).call();
        candidates = votingData[0];
        votes = votingData[1];
    } catch (e) {
        candidatesList.innerHTML = '<div class="error-message">No candidates found for this voting.</div>';
        return;
    }
    candidates.forEach((c, i) => {
        const row = document.createElement('div');
        row.className = 'candidate-vote-row';
        row.innerHTML = `
            <span style="min-width:120px;display:inline-block;font-size:1.08rem;">${c}</span>
            <span style="font-weight:bold;font-size:1.08rem;">${votes[i]}</span>
            <button class="remove-candidate" title="Delete Candidate" style="margin-left:auto;" data-candidate="${c}"><i class="fas fa-trash"></i></button>
        `;
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '1.2rem';
        candidatesList.appendChild(row);
    });
    // Attach delete handlers
    document.querySelectorAll('.remove-candidate').forEach(btn => {
        btn.onclick = async (e) => {
            const candidate = btn.getAttribute('data-candidate');
            if (!candidate) return;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            try {
                const gasPrice = await web3.eth.getGasPrice();
                await votingContract.methods.deleteCandidate(identifier, candidate).send({ from: userAccount, gas: 300000, gasPrice });
                await renderCandidatesSection(identifier);
            } catch (err) {
                alert('Error deleting candidate: ' + (err && err.message ? err.message : 'Transaction failed.'));
            }
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-trash"></i>';
        };
    });
    // Add candidate popup logic
    const addCandidateBtn = document.getElementById('add-candidate-btn');
    const addCandidateModal = document.getElementById('add-candidate-modal');
    const closeAddCandidateBtn = document.getElementById('close-add-candidate');
    const addCandidateForm = document.getElementById('add-candidate-form');
    const addCandidateStatus = document.getElementById('add-candidate-status');
    const candidateNameInput = document.getElementById('candidate-name');

    // Hide popup on every render to avoid auto-show
    addCandidateModal.classList.add('hidden');

    addCandidateBtn.onclick = () => {
        addCandidateModal.classList.remove('hidden');
        addCandidateStatus.innerHTML = '';
        candidateNameInput.value = '';
        candidateNameInput.focus();
    };
    closeAddCandidateBtn.onclick = () => {
        addCandidateModal.classList.add('hidden');
        addCandidateStatus.innerHTML = '';
        candidateNameInput.value = '';
    };
    addCandidateForm.onsubmit = async (e) => {
        e.preventDefault();
        const name = candidateNameInput.value.trim();
        if (!name) {
            addCandidateStatus.innerHTML = '<div class="error-message">Candidate name required.</div>';
            return;
        }
        addCandidateStatus.innerHTML = 'Processing...';
        try {
            const gasPrice = await web3.eth.getGasPrice();
            await votingContract.methods.addCandidate(identifier, name).send({ from: userAccount, gas: 300000, gasPrice });
            addCandidateStatus.innerHTML = '<span style="color:#27ae60;font-weight:bold;">Candidate added!</span>';
            setTimeout(() => {
                addCandidateModal.classList.add('hidden');
                addCandidateStatus.innerHTML = '';
                candidateNameInput.value = '';
                renderCandidatesSection(identifier);
            }, 1200);
        } catch (err) {
            addCandidateStatus.innerHTML = `<span style="color:#e74c3c;">Error: ${err && err.message ? err.message : 'Transaction failed.'}</span>`;
        }
    };
    // Delete voting logic
    document.getElementById('delete-voting-btn').onclick = async () => {
        if (!confirm('Are you sure you want to delete this voting? This action cannot be undone.')) return;
        document.getElementById('delete-voting-btn').disabled = true;
        document.getElementById('delete-voting-btn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
        try {
            const gasPrice = await web3.eth.getGasPrice();
            await votingContract.methods.deleteVoting(identifier).send({ from: userAccount, gas: 300000, gasPrice });
            window.location.href = 'profile.html';
        } catch (err) {
            alert('Error deleting voting: ' + (err && err.message ? err.message : 'Transaction failed.'));
        }
        document.getElementById('delete-voting-btn').disabled = false;
        document.getElementById('delete-voting-btn').innerHTML = '<i class="fas fa-trash"></i> Delete Voting';
    };
}

async function renderRequestedUsersSection(identifier) {
    const usersList = document.getElementById('requested-users-list');
    const statusDiv = document.getElementById('requested-users-status');
    usersList.innerHTML = '';
    statusDiv.innerHTML = '';
    let addresses = [];
    try {
        addresses = await nftFactoryContract.methods.fetchData(identifier).call();
    } catch (e) {
        usersList.innerHTML = '<div class="error-message">No user requested for voting.</div>';
        document.getElementById('give-access-all-btn').style.display = 'none';
        return;
    }
    if (!addresses || addresses.length === 0) {
        usersList.innerHTML = '<div class="error-message">No user requested for voting.</div>';
        document.getElementById('give-access-all-btn').style.display = 'none';
        return;
    }
    document.getElementById('give-access-all-btn').style.display = 'inline-block';
    // Render each address with a Give NFT button
    addresses.forEach(addr => {
        const row = document.createElement('div');
        row.className = 'nft-owner-card';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'space-between';
        row.innerHTML = `<span class="contract-address">${addr}</span><button class="btn-main give-nft-btn" data-addr="${addr}" style="margin-left:auto;width:140px;"><i class="fas fa-gift"></i></button>`;
        usersList.appendChild(row);
    });
    // Give NFT button logic
    document.querySelectorAll('.give-nft-btn').forEach(btn => {
        btn.onclick = async () => {
            const addr = btn.getAttribute('data-addr');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            statusDiv.innerHTML = 'Processing...';
            try {
                const gasPrice = await web3.eth.getGasPrice();
                await nftFactoryContract.methods.mintNFT(identifier, addr).send({ from: userAccount, gas: 300000, gasPrice });
                statusDiv.innerHTML = '<span style="color:#27ae60;font-weight:bold;">NFT sent!</span>';
                setTimeout(() => renderRequestedUsersSection(identifier), 1200);
            } catch (err) {
                statusDiv.innerHTML = `<span style="color:#e74c3c;">Error: ${err && err.message ? err.message : 'Transaction failed.'}</span>`;
            }
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-gift"></i> Give NFT';
        };
    });
    // Give access to all users logic
    document.getElementById('give-access-all-btn').onclick = async () => {
        document.getElementById('give-access-all-btn').disabled = true;
        document.getElementById('give-access-all-btn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        statusDiv.innerHTML = 'Processing...';
        try {
            const gasPrice = await web3.eth.getGasPrice();
            await nftFactoryContract.methods.batchMintNFTs(identifier, addresses).send({ from: userAccount, gas: 600000, gasPrice });
            statusDiv.innerHTML = '<span style="color:#27ae60;font-weight:bold;">NFTs sent to all!</span>';
            setTimeout(() => renderRequestedUsersSection(identifier), 1200);
        } catch (err) {
            statusDiv.innerHTML = `<span style="color:#e74c3c;">Error: ${err && err.message ? err.message : 'Transaction failed.'}</span>`;
        }
        document.getElementById('give-access-all-btn').disabled = false;
        document.getElementById('give-access-all-btn').innerHTML = '<i class="fas fa-users"></i> Give Access to All Users';
    };
}

async function renderNFTOwnersSection(identifier) {
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
        ownerCard.innerHTML = `<span class="contract-address">${addr}</span> <span class="status-icon" title="${voted ? 'Voted' : 'Not Voted'}">${voted ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-times-circle"></i>'}</span>`;
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

    const addCandidateModal = document.getElementById('add-candidate-modal');
    const addCandidateBtn = document.getElementById('add-candidate-btn');
    const closeAddCandidateBtn = document.getElementById('close-add-candidate');
    const addCandidateStatus = document.getElementById('add-candidate-status');
    const candidateNameInput = document.getElementById('candidate-name');

    // Hide popup on initial load
    if (addCandidateModal) {
        addCandidateModal.classList.add('hidden');
    }
    if (addCandidateBtn && addCandidateModal) {
        addCandidateBtn.onclick = () => {
            addCandidateModal.classList.remove('hidden');
            addCandidateStatus.innerHTML = '';
            candidateNameInput.value = '';
            candidateNameInput.focus();
        };
    }
    if (closeAddCandidateBtn && addCandidateModal) {
        closeAddCandidateBtn.onclick = () => {
            addCandidateModal.classList.add('hidden');
            addCandidateStatus.innerHTML = '';
            candidateNameInput.value = '';
        };
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