let web3;
let accounts;
let votingContract;
let nftFactoryContract;

const VOTING_CONTRACT_ADDRESS = '0xcd7d674128e9218bd0eafc76060189ea0caf8ff0';
const NFT_FACTORY_CONTRACT_ADDRESS = '0x74c06b5f6f1685dc0f6c02886f2b70c88736b0d9';

// Contract ABI for Voting contract
const VotingABI = [
    {
        "inputs": [],
        "name": "getOngoingVotings",
        "outputs": [{"internalType": "string[]", "name": "", "type": "string[]"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string", "name": "identifier", "type": "string"}],
        "name": "getVotingDetails",
        "outputs": [
            {"internalType": "string", "name": "title", "type": "string"},
            {"internalType": "string", "name": "description", "type": "string"},
            {"internalType": "address", "name": "nftContract", "type": "address"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string", "name": "identifier", "type": "string"}],
        "name": "getStartDate",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string", "name": "identifier", "type": "string"}],
        "name": "getEndDate",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
];

// NFT Factory Contract ABI
const NFTFactoryABI = [
    {
        "inputs": [{"internalType": "string", "name": "identifier", "type": "string"}],
        "name": "identifierToOwner",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    }
];

// Initialize web3 and contracts
async function init() {
    try {
        const provider = new Web3.providers.HttpProvider('https://polygon-rpc.com');
        web3 = new Web3(provider);

        votingContract = new web3.eth.Contract(VotingABI, VOTING_CONTRACT_ADDRESS);
        nftFactoryContract = new web3.eth.Contract(NFTFactoryABI, NFT_FACTORY_CONTRACT_ADDRESS);

        const storedAccount = localStorage.getItem('connectedWallet');
        if (storedAccount && window.ethereum) {
            try {
                accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const account = accounts[0];

                if (account.toLowerCase() === storedAccount.toLowerCase()) {
                    handleWalletConnected(account);
                    await loadUserVotings();
                }
            } catch (error) {
                console.error('Error reconnecting wallet:', error);
                localStorage.removeItem('connectedWallet');
            }
        }
    } catch (error) {
        console.error('Error initializing:', error);
        showError('Error initializing: ' + error.message);
    }
}

// Connect wallet button handler
document.getElementById('connect-wallet').addEventListener('click', async () => {
    try {
        if (window.ethereum) {
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];

            handleWalletConnected(account);
            await loadUserVotings();
        } else {
            showError('Please install MetaMask to connect your wallet');
        }
    } catch (error) {
        console.error('Error connecting wallet:', error);
        showError('Error connecting wallet: ' + error.message);
    }
});

// Handle wallet connection
function handleWalletConnected(account) {
    const connectButton = document.getElementById('connect-wallet');
    const walletAddress = document.getElementById('wallet-address');

    connectButton.textContent = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
    connectButton.style.backgroundColor = '#27ae60';
    walletAddress.textContent = account;

    localStorage.setItem('connectedWallet', account);
}

// Load user's created votings (Optimized)
async function loadUserVotings() {
    if (!accounts || accounts.length === 0) return;

    try {
        const votingsList = document.getElementById('user-votings-list');
        votingsList.innerHTML = '';

        const ongoingVotings = await votingContract.methods.getOngoingVotings().call();

        if (!ongoingVotings.length) {
            votingsList.innerHTML = '<p>No votings available.</p>';
            return;
        }

        // Fetch all owners parallel
        const ownerPromises = ongoingVotings.map(identifier =>
            nftFactoryContract.methods.identifierToOwner(identifier).call()
                .then(owner => ({ identifier, owner }))
                .catch(() => null)
        );
        const owners = await Promise.all(ownerPromises);

        const userVotings = owners.filter(o => o && o.owner.toLowerCase() === accounts[0].toLowerCase());

        if (userVotings.length === 0) {
            votingsList.innerHTML = '<p>No votings created by you found.</p>';
            return;
        }

        // Fetch all details parallel
        const detailPromises = userVotings.map(async ({ identifier }) => {
            const [details, startTime, endTime] = await Promise.all([
                votingContract.methods.getVotingDetails(identifier).call(),
                votingContract.methods.getStartDate(identifier).call(),
                votingContract.methods.getEndDate(identifier).call()
            ]);
            return { identifier, details, startTime, endTime };
        });

        const votingDetails = await Promise.all(detailPromises);

        for (const voting of votingDetails) {
            const now = Math.floor(Date.now() / 1000);
            const isOngoing = now >= voting.startTime && now <= voting.endTime;

            const votingCard = document.createElement('div');
            votingCard.className = 'voting-card';
            votingCard.innerHTML = `
                <h4>${voting.details.title}</h4>
                <p>${voting.details.description}</p>
                <p class="voting-id">Identifier: ${voting.identifier}</p>
                <p class="nft-contract">NFT Contract: ${voting.details.nftContract}</p>
                <div class="status ${isOngoing ? 'status-ongoing' : 'status-ended'}">
                    ${isOngoing ? 'Ongoing' : 'Ended'}
                </div>
                <div class="time-info">
                    <p>Start: ${new Date(voting.startTime * 1000).toLocaleString()}</p>
                    <p>End: ${new Date(voting.endTime * 1000).toLocaleString()}</p>
                </div>
                ${isOngoing ?
                    `<button class="btn-vote btn-vote-now" onclick="editVoting('${voting.identifier}')">
                        <i class="fas fa-edit"></i> Edit Voting
                    </button>` :
                    `
                    <a href="result.html?id=${voting.identifier}" class="btn-result" >View Result</a>`
                }
            `;
            votingsList.appendChild(votingCard);
        }
    } catch (error) {
        console.error('Error loading votings:', error);
        showError('Error loading votings: ' + error.message);
    }
}

// Edit Voting Button Handler
async function editVoting(identifier) {
    console.log('Edit voting:', identifier);
    // You can redirect or open a modal here
}

// View Results Button Handler
async function viewResults(identifier) {
    console.log('View results:', identifier);
    // You can redirect or open a modal here
}

// Account and chain listeners
if (window.ethereum) {
    window.ethereum.on('accountsChanged', (newAccounts) => {
        if (newAccounts.length === 0) {
            const connectButton = document.getElementById('connect-wallet');
            const walletAddress = document.getElementById('wallet-address');

            connectButton.textContent = 'Connect Wallet';
            connectButton.style.backgroundColor = '#3498db';
            walletAddress.textContent = 'Not connected';

            document.getElementById('user-votings-list').innerHTML = '';
            localStorage.removeItem('connectedWallet');
        } else {
            accounts = newAccounts;
            handleWalletConnected(newAccounts[0]);
            loadUserVotings();
        }
    });

    window.ethereum.on('chainChanged', () => {
        window.location.reload();
    });
}

// Show Error Helper
function showError(message) {
    const votingsContainer = document.getElementById('user-votings-list');
    votingsContainer.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
            <p>Please try refreshing the page or check your network connection.</p>
        </div>
    `;
}

// Initialize on page load
window.addEventListener('load', init);