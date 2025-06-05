// NFTFactory Contract ABI
const NFTFactoryABI = [
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "identifier",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "symbol",
                "type": "string"
            }
        ],
        "name": "createVotingPowerNFT",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "name": "identifierToContract",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
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
                "name": "",
                "type": "string"
            }
        ],
        "name": "identifierToOwner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// NFTFactory Contract Address on Polygon mainnet
const NFTFactoryAddress = "0x74c06b5f6f1685dc0f6c02886f2b70c88736b0d9";

// Global variables for web3 and contract
let web3;
let accounts;
let nftFactoryContract; 

// Function to initialize contract
async function initContract() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            web3 = new Web3(window.ethereum);
            nftFactoryContract = new web3.eth.Contract(NFTFactoryABI, NFTFactoryAddress);
            return true;
        } catch (error) {
            console.error('Error initializing contract:', error);
            return false;
        }
    }
    return false;
}

// Function to create NFT contract
async function createNFTContract(identifier, name, symbol) {
    try {
        // Get current gas price from the network
        const gasPrice = await web3.eth.getGasPrice();
        
        const result = await nftFactoryContract.methods
            .createVotingPowerNFT(identifier, name, symbol)
            .send({ 
                from: accounts[0],
                gas: 5000000, // Set to 5 million gas limit
                gasPrice: gasPrice // Use current market gas price
            });

        return result;
    } catch (error) {
        console.error('Error creating NFT contract:', error);
        throw error;
    }
} 