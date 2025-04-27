// Contract ABI for Voting contract
const VotingABI = [
    {
        "inputs": [],
        "name": "getOngoingVotings",
        "outputs": [
            {
                "internalType": "string[]",
                "name": "",
                "type": "string[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "identifier",
                "type": "string"
            }
        ],
        "name": "getVotingDetails",
        "outputs": [
            {
                "internalType": "string",
                "name": "title",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "description",
                "type": "string"
            },
            {
                "internalType": "address",
                "name": "nftContract",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "identifier",
                "type": "string"
            }
        ],
        "name": "getStartDate",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "identifier",
                "type": "string"
            }
        ],
        "name": "getEndDate",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// Contract address on Polygon mainnet
const VotingAddress = "0xcd7d674128e9218bd0eafc76060189ea0caf8ff0";

let web3;
let accounts;
let votingContract;

// Initialize web3 and contract
async function init() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            web3 = new Web3(window.ethereum);
            
            // Check if already connected
            accounts = await web3.eth.getAccounts();
            if (accounts.length > 0) {
                handleWalletConnected(accounts[0]);
            }

            // Initialize contract
            votingContract = new web3.eth.Contract(VotingABI, VotingAddress);
            
            // Fetch ongoing votings
            await fetchOngoingVotings();
        } catch (error) {
            console.error('Error initializing:', error);
        }
    }
}

// Connect wallet button handler
document.getElementById('connect-wallet').addEventListener('click', async () => {
    try {
        accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        handleWalletConnected(accounts[0]);
        await fetchOngoingVotings();
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Error connecting wallet. Please try again.');
    }
});

// Handle wallet connection
function handleWalletConnected(account) {
    const connectButton = document.getElementById('connect-wallet');
    connectButton.textContent = account.slice(0, 6) + '...' + account.slice(-4);
    connectButton.style.backgroundColor = '#27ae60';
}

// Create voting button handler
document.getElementById('create-voting-btn').addEventListener('click', () => {
    if (accounts && accounts.length > 0) {
        window.location.href = 'create-nft.html';
    } else {
        alert('Please connect your wallet first');
    }
});

// Fetch ongoing votings
async function fetchOngoingVotings() {
    try {
        console.log('Fetching ongoing votings...');
        const votingsContainer = document.getElementById('ongoing-votings');
        votingsContainer.innerHTML = ''; // Clear existing votings

        // Get ongoing votings
        const ongoingVotings = await votingContract.methods.getOngoingVotings().call();
        console.log('Ongoing votings:', ongoingVotings);
        
        if (!ongoingVotings || ongoingVotings.length === 0) {
            votingsContainer.innerHTML = '<p>No ongoing votings found.</p>';
            return;
        }
        
        for (const identifier of ongoingVotings) {
            console.log('Processing voting:', identifier);
            
            try {
                // Get voting details
                const details = await votingContract.methods.getVotingDetails(identifier).call();
                console.log('Raw voting details:', details);
                
                // Extract values from the details object
                const title = details[0] || 'Untitled';
                const description = details[1] || 'No description available';
                const nftContract = details[2] || '0x0000000000000000000000000000000000000000';
                
                console.log('Processed voting details:', { title, description, nftContract });
                
                // Get start and end times
                const startTime = await votingContract.methods.getStartDate(identifier).call();
                const endTime = await votingContract.methods.getEndDate(identifier).call();
                console.log('Voting times:', { startTime, endTime });
                
                // Convert timestamps to numbers
                const startTimeNum = Number(startTime);
                const endTimeNum = Number(endTime);
                
                const now = Math.floor(Date.now() / 1000);
                const isOngoing = now >= startTimeNum && now <= endTimeNum;
                
                const votingCard = createVotingCard({
                    identifier,
                    title,
                    description,
                    nftContract,
                    startTime: startTimeNum * 1000,
                    endTime: endTimeNum * 1000
                });
                
                votingsContainer.appendChild(votingCard);
            } catch (error) {
                console.error(`Error processing voting ${identifier}:`, error);
                // Create an error card with more details
                const errorCard = document.createElement('div');
                errorCard.className = 'voting-card';
                errorCard.innerHTML = `
                    <h3>Error Loading Voting</h3>
                    <p>Identifier: ${identifier}</p>
                    <p class="error-message">Error: ${error.message || 'Could not load voting details'}</p>
                    <p class="error-message">Please check the console for more details</p>
                `;
                votingsContainer.appendChild(errorCard);
            }
        }
    } catch (error) {
        console.error('Error fetching ongoing votings:', error);
        const votingsContainer = document.getElementById('ongoing-votings');
        votingsContainer.innerHTML = `
            <p class="error-message">Error loading votings: ${error.message || 'Unknown error'}</p>
            <p class="error-message">Please check the console for more details</p>
        `;
    }
}

function createVotingCard(voting) {
    const card = document.createElement('div');
    card.className = 'voting-card';
    
    const isOngoing = voting.endTime > Date.now();
    const statusClass = isOngoing ? 'status-ongoing' : 'status-ended';
    const statusText = isOngoing ? 'Ongoing' : 'Ended';
    
    // Convert timestamps to IST
    const startTimeIST = new Date(voting.startTime).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    
    const endTimeIST = new Date(voting.endTime).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    
    card.innerHTML = `
        <h3>${voting.title}</h3>
        <p>${voting.description}</p>
        <p class="voting-id">Voting ID: ${voting.identifier}</p>
        <p class="nft-contract">NFT Contract: <span class="contract-address">${voting.nftContract}</span></p>
        <div class="time-info">
            <p>Start: ${startTimeIST} (IST)</p>
            <p>End: ${endTimeIST} (IST)</p>
        </div>
        <span class="status ${statusClass}">${statusText}</span>
        <button class="btn-vote" ${!isOngoing ? 'disabled' : ''}>
            ${isOngoing ? 'Vote Now' : 'Voting Ended'}
        </button>
    `;
    
    return card;
}

// Listen for account changes
window.ethereum.on('accountsChanged', (newAccounts) => {
    if (newAccounts.length === 0) {
        const connectButton = document.getElementById('connect-wallet');
        connectButton.textContent = 'Connect Wallet';
        connectButton.style.backgroundColor = '#3498db';
    } else {
        handleWalletConnected(newAccounts[0]);
    }
});

// Listen for chain changes
window.ethereum.on('chainChanged', () => {
    window.location.reload();
});

// Initialize when page loads
window.addEventListener('load', init); 