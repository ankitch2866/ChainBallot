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
let votingContract;

// Handle wallet connection
function handleWalletConnected(account) {
    const connectButton = document.getElementById('connect-wallet');
    const buttonIcon = connectButton.querySelector('i');
    const buttonText = connectButton.querySelector('span');
    const walletDropdown = document.querySelector('.wallet-dropdown');
    
    buttonText.textContent = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
    connectButton.disabled = true;
    
    // Add connected class to enable dropdown
    walletDropdown.classList.add('wallet-connected');
    
    // Store the connected wallet address
    localStorage.setItem('connectedWallet', account);
}

// Profile button handler
document.getElementById('profile-btn').addEventListener('click', () => {
    window.location.href = 'profile.html';
});

// Disconnect button handler
document.getElementById('disconnect-btn').addEventListener('click', () => {
    // Clear stored wallet address
    localStorage.removeItem('connectedWallet');
    
    // Reset wallet button
    const connectButton = document.getElementById('connect-wallet');
    const buttonText = connectButton.querySelector('span');
    const walletDropdown = document.querySelector('.wallet-dropdown');
    
    buttonText.textContent = 'Connect Wallet';
    connectButton.disabled = false;
    
    // Remove connected class to disable dropdown
    walletDropdown.classList.remove('wallet-connected');
    
    // Reset web3 instance
    web3 = new Web3(new Web3.providers.HttpProvider('https://polygon-rpc.com'));
    votingContract = new web3.eth.Contract(VotingABI, VotingAddress);
    
    // Refresh the page to clear any wallet-dependent content
    window.location.reload();
});

// Initialize web3 and contract
async function init() {
    try {
        // Use a public RPC endpoint for Polygon
        const provider = new Web3.providers.HttpProvider('https://polygon-rpc.com');
        web3 = new Web3(provider);

            // Initialize contract
            votingContract = new web3.eth.Contract(VotingABI, VotingAddress);
        
        // Remove connected class initially
        const walletDropdown = document.querySelector('.wallet-dropdown');
        walletDropdown.classList.remove('wallet-connected');
        
        // Check for stored wallet connection
        const storedAccount = localStorage.getItem('connectedWallet');
        if (storedAccount && window.ethereum) {
            try {
                // Request account access
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const account = accounts[0];
                
                if (account.toLowerCase() === storedAccount.toLowerCase()) {
                    handleWalletConnected(account);
                }
            } catch (error) {
                console.error('Error reconnecting wallet:', error);
                localStorage.removeItem('connectedWallet');
            }
        }
            
            // Fetch ongoing votings
            await fetchOngoingVotings();
        } catch (error) {
            console.error('Error initializing:', error);
        showError('Error initializing: ' + error.message);
    }
}

// Create voting button handler
document.getElementById('create-voting-btn').addEventListener('click', () => {
    window.location.href = 'create-nft.html';
});

// Connect wallet button handler
document.getElementById('connect-wallet').addEventListener('click', async () => {
    try {
        if (window.ethereum) {
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            
            handleWalletConnected(account);
        } else {
            showError('Please install MetaMask to connect your wallet');
        }
    } catch (error) {
        console.error('Error connecting wallet:', error);
        showError('Error connecting wallet: ' + error.message);
    }
});

// Fetch ongoing votings with improved error handling and parallel requests
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
        
        // Create loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = '<p>Loading votings...</p>';
        votingsContainer.appendChild(loadingIndicator);
                
        // Process all votings in parallel
        const votingPromises = ongoingVotings.map(async (identifier) => {
            try {
                // Get all details in parallel
                const [details, startTime, endTime] = await Promise.all([
                    votingContract.methods.getVotingDetails(identifier).call(),
                    votingContract.methods.getStartDate(identifier).call(),
                    votingContract.methods.getEndDate(identifier).call()
                ]);
                
                return {
                    identifier,
                    title: details[0] || 'Untitled',
                    description: details[1] || 'No description available',
                    nftContract: details[2] || '0x0000000000000000000000000000000000000000',
                    startTime: Number(startTime) * 1000,
                    endTime: Number(endTime) * 1000
                };
            } catch (error) {
                console.error(`Error processing voting ${identifier}:`, error);
                return {
                    identifier,
                    error: true,
                    errorMessage: error.message || 'Could not load voting details'
                };
            }
        });

        // Wait for all voting data to be fetched
        const votingData = await Promise.all(votingPromises);
        
        // Remove loading indicator
        votingsContainer.removeChild(loadingIndicator);
        
        // Create and append voting cards
        votingData.forEach(data => {
            if (data.error) {
                const errorCard = document.createElement('div');
                errorCard.className = 'voting-card error';
                errorCard.innerHTML = `
                    <h3>Error Loading Voting</h3>
                    <p>Identifier: ${data.identifier}</p>
                    <p class="error-message">Error: ${data.errorMessage}</p>
                `;
                votingsContainer.appendChild(errorCard);
            } else {
                const votingCard = createVotingCard(data);
                votingsContainer.appendChild(votingCard);
            }
        });
    } catch (error) {
        console.error('Error fetching ongoing votings:', error);
        showError('Error loading votings: ' + error.message);
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

// Initialize when page loads
window.addEventListener('load', init); 

// Helper function to show errors
function showError(message) {
    const votingsContainer = document.getElementById('ongoing-votings');
    votingsContainer.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
            <p>Please try refreshing the page or check your network connection.</p>
        </div>
    `;
} 