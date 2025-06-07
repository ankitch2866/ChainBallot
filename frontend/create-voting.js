// Contract ABIs
const NFTFactoryABI = [
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "symbol",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "baseURI",
                "type": "string"
            }
        ],
        "name": "createNFTContract",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

const VotingABI = [
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "identifier",
                "type": "string"
            },
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
                "internalType": "uint256",
                "name": "startTime",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "endTime",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "nftContract",
                "type": "address"
            },
            {
                "internalType": "string[]",
                "name": "initialCandidates",
                "type": "string[]"
            }
        ],
        "name": "createVoting",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Contract addresses on Polygon mainnet
const NFTFactoryAddress = "0x74c06b5f6f1685dc0f6c02886f2b70c88736b0d9";
const VotingAddress = "0xcd7d674128e9218bd0eafc76060189ea0caf8ff0";

let web3;
let accounts;
let nftFactoryContract;
let votingContract;

// Initialize web3 and contracts
async function init() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            web3 = new Web3(window.ethereum);
            
            // Check if already connected
            accounts = await web3.eth.getAccounts();
            if (accounts.length > 0) {
                handleWalletConnected(accounts[0]);
            }

            // Initialize contracts
            nftFactoryContract = new web3.eth.Contract(NFTFactoryABI, NFTFactoryAddress);
            votingContract = new web3.eth.Contract(VotingABI, VotingAddress);
        } catch (error) {
            console.error('Error initializing:', error);
            alert('Error initializing: ' + error.message);
        }
    } else {
        alert('Please install MetaMask to use this application');
    }
}

// Connect wallet button handler
document.getElementById('connect-wallet').addEventListener('click', async () => {
    try {
        accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        handleWalletConnected(accounts[0]);
    } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Error connecting wallet: ' + error.message);
    }
});

// Handle wallet connection
function handleWalletConnected(account) {
    const connectButton = document.getElementById('connect-wallet');
    connectButton.textContent = account.slice(0, 6) + '...' + account.slice(-4);
    connectButton.style.backgroundColor = '#27ae60';
}

// Add candidate button handler
document.getElementById('add-candidate').addEventListener('click', () => {
    const container = document.getElementById('candidates-container');
    const div = document.createElement('div');
    div.className = 'candidate-input';
    div.innerHTML = `
        <input type="text" class="candidate" required placeholder="Enter candidate name">
        <button type="button" class="remove-candidate">Remove</button>
    `;
    container.appendChild(div);
    
    // Add remove handler
    div.querySelector('.remove-candidate').addEventListener('click', () => {
        container.removeChild(div);
    });
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize web3 and contracts
    init();

    // Voting form submission handler
    const form = document.getElementById('create-voting-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission
            
            if (!accounts || accounts.length === 0) {
                alert('Please connect your wallet first');
                return;
            }

            const identifier = localStorage.getItem('votingIdentifier');
            const nftContractAddress = localStorage.getItem('nftContractAddress');
            
            if (!identifier || !nftContractAddress) {
                alert('Please create an NFT first');
                window.location.href = 'create-nft.html';
                return;
            }

            const title = document.getElementById('title').value;
            const description = document.getElementById('description').value;
            
            // Convert IST time to UTC timestamp
            const startTimeIST = new Date(document.getElementById('start-time').value);
            const endTimeIST = new Date(document.getElementById('end-time').value);
            
            // Convert to UTC timestamp (seconds)
            const startTime = Math.floor(startTimeIST.getTime() / 1000);
            const endTime = Math.floor(endTimeIST.getTime() / 1000);
            
            // Get all candidate values
            const candidates = Array.from(document.querySelectorAll('.candidate'))
                .map(input => input.value)
                .filter(value => value.trim() !== '');

            if (candidates.length === 0) {
                alert('Please add at least one candidate');
                return;
            }

            const resultSection = document.getElementById('result-section');
            const statusElement = document.getElementById('transaction-status');

            try {
                // Show loading state
                resultSection.classList.remove('hidden');
                statusElement.textContent = 'Processing transaction...';
                statusElement.style.color = '#3498db';

                // Get current gas price
                const gasPrice = await web3.eth.getGasPrice();

                // Call createVoting function
                const result = await votingContract.methods
                    .createVoting(
                        identifier,
                        title,
                        description,
                        startTime,
                        endTime,
                        nftContractAddress,
                        candidates
                    )
                    .send({ 
                        from: accounts[0],
                        gas: 5000000, // 5 million gas limit
                        gasPrice: gasPrice // Use current market gas price
                    });

                console.log('Transaction result:', result);

                statusElement.textContent = 'Voting created successfully!';
                statusElement.style.color = '#27ae60';
                
                // Add Back to Home button
                const backButton = document.createElement('button');
                backButton.className = 'btn';
                backButton.textContent = 'Back to Home';
                backButton.onclick = () => {
                    // Clear all stored data
                    localStorage.removeItem('votingIdentifier');
                    localStorage.removeItem('nftContractAddress');
                    // Redirect to home page
                    window.location.href = 'home.html';
                };
                resultSection.appendChild(backButton);

            } catch (error) {
                console.error('Error creating voting:', error);
                resultSection.classList.remove('hidden');
                statusElement.textContent = 'Error: ' + (error.message || 'Transaction failed');
                statusElement.style.color = '#e74c3c';
            }
        });
    }
});

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