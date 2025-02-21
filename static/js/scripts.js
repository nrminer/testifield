const BASE_URL = 'http://192.168.10.204:5001'; // Poker Tracker backend
const playersContainer = document.getElementById('players');
const SYNC_INTERVAL = 5000; // Auto-sync interval in milliseconds (5 seconds)

function autoSync() {
    fetchPlayers(); // Fetch players and update the UI
    setTimeout(autoSync, SYNC_INTERVAL); // Schedule the next sync
}

// Start auto-sync when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchPlayers(); // Initial fetch of players
    autoSync(); // Start auto-sync
});


function renderPlayers(players) {
    const playersContainer = document.getElementById('players');
    playersContainer.innerHTML = ''; // Clear existing players

    players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player';

        const playerName = document.createElement('h3');
        playerName.textContent = player.name;

        const cardsDiv = document.createElement('div');
        cardsDiv.className = 'cards';

        player.cards.forEach(card => {
            const cardDiv = document.createElement('div');
            cardDiv.className = `card ${card.hidden ? 'hidden' : ''}`;

            const cardImage = document.createElement('img');
            cardImage.src = card.hidden ? 'static/images/card_back.png' : `static/images/${formatCardName(card.value)}.png`;
            cardDiv.appendChild(cardImage);
            cardsDiv.appendChild(cardDiv);
        });

        playerDiv.appendChild(playerName);
        playerDiv.appendChild(cardsDiv);
        playersContainer.appendChild(playerDiv);
    });
}


function renderCommunityCards(cards) {
    const communityCardsContainer = document.getElementById('communityCardsContainer');
    communityCardsContainer.innerHTML = ''; // Clear existing cards

    // Ensure we always display 5 cards
    for (let i = 0; i < MAX_CARDS; i++) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';

        const cardImage = document.createElement('img');
        
        if (i < cards.length && !cards[i].hidden) {
            // If the card is not hidden, show the actual card
            cardImage.src = `static/images/${formatCardName(cards[i].value)}.png`;
            cardImage.alt = cards[i].value;
        } else {
            // Otherwise, show the back of the card
            cardImage.src = 'static/images/card_back.png';
            cardImage.alt = 'Card Back';
        }

        cardDiv.appendChild(cardImage);
        communityCardsContainer.appendChild(cardDiv);
    }
}


function formatCardName(cardValue) {
    const cardMap = {
        '2H': '2_of_hearts',
        '3H': '3_of_hearts',
        '4H': '4_of_hearts',
        '5H': '5_of_hearts',
        '6H': '6_of_hearts',
        '7H': '7_of_hearts',
        '8H': '8_of_hearts',
        '9H': '9_of_hearts',
        'TH': '10_of_hearts',
        'JH': 'jack_of_hearts',
        'QH': 'queen_of_hearts',
        'KH': 'king_of_hearts',
        'AH': 'ace_of_hearts',
        '2D': '2_of_diamonds',
        '3D': '3_of_diamonds',
        '4D': '4_of_diamonds',
        '5D': '5_of_diamonds',
        '6D': '6_of_diamonds',
        '7D': '7_of_diamonds',
        '8D': '8_of_diamonds',
        '9D': '9_of_diamonds',
        'TD': '10_of_diamonds',
        'JD': 'jack_of_diamonds',
        'QD': 'queen_of_diamonds',
        'KD': 'king_of_diamonds',
        'AD': 'ace_of_diamonds',
        '2S': '2_of_spades',
        '3S': '3_of_spades',
        '4S': '4_of_spades',
        '5S': '5_of_spades',
        '6S': '6_of_spades',
        '7S': '7_of_spades',
        '8S': '8_of_spades',
        '9S': '9_of_spades',
        'TS': '10_of_spades',
        'JS': 'jack_of_spades',
        'QS': 'queen_of_spades',
        'KS': 'king_of_spades',
        'AS': 'ace_of_spades',
        '2C': '2_of_clubs',
        '3C': '3_of_clubs',
        '4C': '4_of_clubs',
        '5C': '5_of_clubs',
        '6C': '6_of_clubs',
        '7C': '7_of_clubs',
        '8C': '8_of_clubs',
        '9C': '9_of_clubs',
        'TC': '10_of_clubs',
        'JC': 'jack_of_clubs',
        'QC': 'queen_of_clubs',
        'KC': 'king_of_clubs',
        'AC': 'ace_of_clubs'
    };

    return cardMap[cardValue] || cardValue; // Return the mapped value or the original if not found
}

function addCommunityCard() {
    const cardInput = document.getElementById('communityCardInput');
    const card = cardInput.value.trim();

    if (!card) {
        alert('Card value cannot be empty.');
        return;
    }

    // Send the card to the community (player named "community")
    fetch(`${BASE_URL}/assign-card`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ player_name: 'community', card: card })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);  // Show the error message
        } else {
            alert(data.message);  // Show the success message
            fetchPlayers();  // Refresh players
            cardInput.value = '';  // Clear the input field
        }
    })
    .catch(error => {
        console.error('Error adding community card:', error);
        alert('Failed to add community card.');
    });
}

function resetCommunityCards() {
    if (!confirm('Are you sure you want to reset community cards?')) {
        return;  // Cancel reset if user does not confirm
    }

    fetch(`${BASE_URL}/reset-game`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);  // Show success message
        fetchPlayers();  // Refresh players
    })
    .catch(error => {
        console.error('Error resetting community cards:', error);
        alert('Failed to reset community cards.');
    });
}

function fetchPlayers() {
    fetch(`${BASE_URL}/get-players`)
        .then(response => response.json())
        .then(data => {
            renderPlayers(data.players);
        })
        .catch(error => {
            console.error('Error fetching players:', error);
            alert('Failed to fetch players.');
        });
}

function assignCard(playerName, card) {
    if (!card.trim()) {
        alert('Card value cannot be empty.');
        return;
    }

    fetch(`${BASE_URL}/assign-card`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ player_name: playerName, card: card }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                alert(data.message);
                fetchPlayers();
            }
        })
        .catch(error => {
            console.error('Error assigning card:', error);
            alert('Failed to assign card.');
        });
}

function resetGame() {
    if (!confirm("Are you sure you want to reset the game?")) {
        return;
    }

    fetch(`${BASE_URL}/reset-game`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            fetchPlayers();
            fetchCommunityCards();
        })
        .catch(error => {
            console.error('Error resetting the game:', error);
            alert('Failed to reset the game.');
        });
}

function viewLogs() {
    fetch(`${BASE_URL}/view-logs`)
        .then(response => response.json())
        .then(data => {
            const logContainer = document.getElementById('logContainer');
            logContainer.innerHTML = ''; // Clear existing logs

            if (data.logs.length === 0) {
                logContainer.innerHTML = '<p>No logs available.</p>';
                return;
            }

            data.logs.forEach((log, index) => {
                const logDiv = document.createElement('div');
                logDiv.className = 'log-entry';

                const logTitle = document.createElement('div');
                logTitle.className = 'log-title';
                logTitle.textContent = `Log #${index + 1}`;
                logDiv.appendChild(logTitle);

                // Players Section
                const playersLog = document.createElement('div');
                playersLog.className = 'player-log';
                playersLog.innerHTML = '<h4>Players:</h4>';
                log.players.forEach(player => {
                    const playerDiv = document.createElement('div');
                    playerDiv.style.marginBottom = '10px';
                    playerDiv.innerHTML = `<strong>${player.name}:</strong>`;
                    const cardsDiv = document.createElement('div');
                    cardsDiv.className = 'cards';
                    player.cards.forEach(card => {
                        const cardDiv = document.createElement('div');
                        cardDiv.className = `card ${card.hidden ? 'hidden' : ''}`;
                        cardDiv.textContent = card.hidden ? '??' : card.value;
                        cardsDiv.appendChild(cardDiv);
                    });
                    playerDiv.appendChild(cardsDiv);
                    playersLog.appendChild(playerDiv);
                });
                logDiv.appendChild(playersLog);

                // Community Cards Section
                const communityLog = document.createElement('div');
                communityLog.className = 'community-log';
                communityLog.innerHTML = '<h4>Community Cards:</h4>';
                const communityCardsDiv = document.createElement('div');
                communityCardsDiv.className = 'cards';
                log.community_cards.forEach(card => {
                    const cardDiv = document.createElement('div');
                    cardDiv.className = 'card';
                    cardDiv.textContent = card.value;
                    communityCardsDiv.appendChild(cardDiv);
                });
                communityLog.appendChild(communityCardsDiv);
                logDiv.appendChild(communityLog);

                logContainer.appendChild(logDiv);
            });
        })
        .catch(error => {
            console.error('Error fetching logs:', error);
            alert('Failed to fetch logs.');
        });
}

// Auto-sync functionality
function autoSync() {
    fetchPlayers(); // Fetch players periodically
    fetchCommunityCards(); // Fetch community cards periodically
    setTimeout(autoSync, SYNC_INTERVAL); // Repeat after the interval
}

document.addEventListener('DOMContentLoaded', () => {
    fetchPlayers();
    fetchCommunityCards();
    autoSync(); // Start auto-sync
});
