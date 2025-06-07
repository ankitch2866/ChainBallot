// Contract ABI for Voting contract
const VotingABI = [
  {
    inputs: [],
    name: "getOngoingVotings",
    outputs: [
      {
        internalType: "string[]",
        name: "",
        type: "string[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "identifier",
        type: "string",
      },
    ],
    name: "getVotingDetails",
    outputs: [
      {
        internalType: "string",
        name: "title",
        type: "string",
      },
      {
        internalType: "string",
        name: "description",
        type: "string",
      },
      {
        internalType: "address",
        name: "nftContract",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "identifier",
        type: "string",
      },
    ],
    name: "getStartDate",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "identifier",
        type: "string",
      },
    ],
    name: "getEndDate",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

// Contract address on Polygon mainnet
const VotingAddress = "0xcd7d674128e9218bd0eafc76060189ea0caf8ff0";

let web3;
let votingContract;

// Handle wallet connection
function handleWalletConnected(account) {
  const connectButton = document.getElementById("connect-wallet");
  const buttonText = connectButton.querySelector("span");
  const walletDropdown = document.querySelector(".wallet-dropdown");

  buttonText.textContent = `${account.substring(0, 6)}...${account.substring(
    account.length - 4
  )}`;
  connectButton.disabled = false;
  connectButton.style.backgroundColor = "#27ae60";
  walletDropdown.classList.add("wallet-connected");
  localStorage.setItem("connectedWallet", account);
}

// Profile button handler
document.getElementById("profile-btn").addEventListener("click", () => {
  window.location.href = "profile.html";
});

// Disconnect button handler
document.getElementById("disconnect-btn").addEventListener("click", () => {
  localStorage.removeItem("connectedWallet");
  const connectButton = document.getElementById("connect-wallet");
  const buttonText = connectButton.querySelector("span");
  const walletDropdown = document.querySelector(".wallet-dropdown");

  buttonText.textContent = "Connect Wallet";
  connectButton.disabled = false;
  connectButton.style.backgroundColor = "#3498db";
  walletDropdown.classList.remove("wallet-connected");

  web3 = new Web3(new Web3.providers.HttpProvider("https://polygon-rpc.com"));
  votingContract = new web3.eth.Contract(VotingABI, VotingAddress);
  window.location.reload();
});

// Initialize web3 and contract
async function init() {
  try {
    const provider = new Web3.providers.HttpProvider("https://polygon-rpc.com");
    web3 = new Web3(provider);
    votingContract = new web3.eth.Contract(VotingABI, VotingAddress);

    const walletDropdown = document.querySelector(".wallet-dropdown");
    walletDropdown.classList.remove("wallet-connected");

    const storedAccount = localStorage.getItem("connectedWallet");
    if (storedAccount && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const account = accounts[0];
        if (account.toLowerCase() === storedAccount.toLowerCase()) {
          handleWalletConnected(account);
        }
      } catch (error) {
        console.error("Error reconnecting wallet:", error);
        localStorage.removeItem("connectedWallet");
      }
    }

    await fetchOngoingVotings();
  } catch (error) {
    console.error("Error initializing:", error);
    showError("Error initializing: " + error.message);
  }
}

// Create voting button handler
document.getElementById("create-voting-btn").addEventListener("click", () => {
  window.location.href = "create-nft.html";
});

// Connect wallet button handler
document
  .getElementById("connect-wallet")
  .addEventListener("click", async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const account = accounts[0];
        handleWalletConnected(account);
      } else {
        showError("Please install MetaMask to connect your wallet");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      showError("Error connecting wallet: " + error.message);
    }
  });

// On page load, restore wallet if present
window.addEventListener("DOMContentLoaded", () => {
  const connectButton = document.getElementById("connect-wallet");
  const buttonText = connectButton.querySelector("span");
  const walletDropdown = document.querySelector(".wallet-dropdown");
  const storedAccount = localStorage.getItem("connectedWallet");
  if (storedAccount) {
    buttonText.textContent = `${storedAccount.substring(
      0,
      6
    )}...${storedAccount.substring(storedAccount.length - 4)}`;
    connectButton.style.backgroundColor = "#27ae60";
    walletDropdown.classList.add("wallet-connected");
  } else {
    buttonText.textContent = "Connect Wallet";
    connectButton.style.backgroundColor = "#3498db";
    walletDropdown.classList.remove("wallet-connected");
  }
});

// Fixed fetch function: batching to avoid rate limits
async function fetchOngoingVotings() {
  try {
    const votingsContainer = document.getElementById("ongoing-votings");
    votingsContainer.innerHTML = "";
    const ongoingVotings = await votingContract.methods
      .getOngoingVotings()
      .call();

    if (!ongoingVotings || ongoingVotings.length === 0) {
      votingsContainer.innerHTML = "<p>No ongoing votings found.</p>";
      return;
    }

    const loadingIndicator = document.createElement("div");
    loadingIndicator.className = "loading-indicator";
    loadingIndicator.innerHTML = "<p>Loading votings...</p>";
    votingsContainer.appendChild(loadingIndicator);

    const concurrencyLimit = 4;
    const results = [];

    for (let i = 0; i < ongoingVotings.length; i += concurrencyLimit) {
      const batch = ongoingVotings.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(async (identifier) => {
        try {
          const [details, startTime, endTime] = await Promise.all([
            votingContract.methods.getVotingDetails(identifier).call(),
            votingContract.methods.getStartDate(identifier).call(),
            votingContract.methods.getEndDate(identifier).call(),
          ]);
          return {
            identifier,
            title: details[0] || "Untitled",
            description: details[1] || "No description available",
            nftContract:
              details[2] || "0x0000000000000000000000000000000000000000",
            startTime: Number(startTime) * 1000,
            endTime: Number(endTime) * 1000,
          };
        } catch (error) {
          return {
            identifier,
            error: true,
            errorMessage: error.message || "Could not load voting details",
          };
        }
      });
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    votingsContainer.removeChild(loadingIndicator);

    // Sort: Ongoing first, Ended after
    results.sort((a, b) => {
      const aEnded = a.endTime <= Date.now();
      const bEnded = b.endTime <= Date.now();
      return aEnded - bEnded; // false (0) comes before true (1)
    });

    results.forEach((data) => {
      if (data.error) {
        const errorCard = document.createElement("div");
        errorCard.className = "voting-card error";
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
    console.error("Error fetching ongoing votings:", error);
    showError("Error loading votings: " + error.message);
  }
}

function createVotingCard(voting) {
  const card = document.createElement("div");
  card.className = "voting-card";

  const isOngoing = voting.endTime > Date.now();
  const statusClass = isOngoing ? "status-ongoing" : "status-ended";
  const statusText = isOngoing ? "Ongoing" : "Ended";

  const startTimeIST = new Date(voting.startTime).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const endTimeIST = new Date(voting.endTime).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
 
  card.innerHTML = `
        <h3>${voting.title}</h3>
        <p>${voting.description}</p>
        <p class="voting-id">Voting ID: ${voting.identifier}</p>
        <p class="nft-contract">NFT Contract: <span class="contract-address">${
          voting.nftContract
        }</span></p>
        <div class="time-info">
            <p>Start: ${startTimeIST} (IST)</p>
            <p>End: ${endTimeIST} (IST)</p>
        </div>
        <span class="status ${statusClass}">${statusText}</span>
        ${
          isOngoing
            ? `<a href="vote.html?id=${voting.identifier}" class="btn-vote btn-vote-now" >Vote Now</a>`
            : `<a href="result.html?id=${voting.identifier}" class="btn-result" >View Result</a>`
        }
    `;

  return card;
}

// Helper to show errors
function showError(message) {
  const votingsContainer = document.getElementById("ongoing-votings");
  votingsContainer.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
            <p>Please try refreshing the page or check your network connection.</p>
        </div>
    `;
}

// Start app
window.addEventListener("load", init);
