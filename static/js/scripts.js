const BASE_URL = 'http://127.0.0.1:5001'; // Poker Tracker backend
const MAX_CARDS = 5; // Maximum number of community cards
const playersContainer = document.getElementById('players');
const SYNC_INTERVAL = 5000; // Auto-sync interval in milliseconds (5 seconds)

function renderPlayers(players) {
    playersContainer.innerHTML = ''; // Clear existing players

    players.forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player';

        const playerName = document.createElement('h3');
        playerName.textContent = player.name;

        const cardsDiv = document.createElement('div');
        cardsDiv.className = 'cards';

        if (player.cards && player.cards.length > 0) {
            player.cards.forEach(card => {
                const cardDiv = document.createElement('div');
                cardDiv.className = `card ${card.hidden ? 'hidden' : ''}`;
                cardDiv.textContent = card.hidden ? '??' : card.value; // Show '??' if hidden
                cardsDiv.appendChild(cardDiv);
            });
        } else {
            const noCardsDiv = document.createElement('div');
            noCardsDiv.textContent = 'No cards yet';
            cardsDiv.appendChild(noCardsDiv);
        }

        playerDiv.appendChild(playerName);
        playerDiv.appendChild(cardsDiv);

        if (player.name.toLowerCase() === 'dealer') {
            const cardInput = document.createElement('input');
            cardInput.type = 'text';
            cardInput.placeholder = 'Enter card';

            const addCardButton = document.createElement('button');
            addCardButton.textContent = 'Add Card';
            addCardButton.onclick = () => assignCard(player.name, cardInput.value);

            playerDiv.appendChild(cardInput);
            playerDiv.appendChild(addCardButton);

            if (!player.revealed) {
                const revealButton = document.createElement('button');
                revealButton.textContent = 'Reveal Dealer Cards';
                revealButton.onclick = () => revealDealer(true);
                playerDiv.appendChild(revealButton);
            }
        }

        playersContainer.appendChild(playerDiv);
    });
}

function renderCommunityCards(cards) {
    const communityCardsContainer = document.getElementById('communityCardsContainer');
    communityCardsContainer.innerHTML = ''; // Clear existing cards

    for (let i = 0; i < MAX_CARDS; i++) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';

        if (i < cards.length) {
            cardDiv.textContent = cards[i].value; // Reveal card
            cardDiv.classList.remove('hidden');
        } else {
            cardDiv.textContent = '??'; // Hidden placeholder
            cardDiv.classList.add('hidden');
        }

        communityCardsContainer.appendChild(cardDiv);
    }
}

function fetchCommunityCards() {
    fetch(`${BASE_URL}/get-community-cards`)
        .then(response => response.json())
        .then(data => {
            renderCommunityCards(data.community_cards);
        })
        .catch(error => {
            console.error('Error fetching community cards:', error);
            alert('Failed to fetch community cards.');
        });
}

function addCommunityCard() {
    const cardInput = document.getElementById('communityCardInput');
    const card = cardInput.value.trim();

    if (!card) {
        alert('Card value cannot be empty.');
        return;
    }

    fetch(`${BASE_URL}/assign-community-card`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ card: card }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                alert(data.message);
                fetchCommunityCards();
                cardInput.value = ''; // Clear the input field
            }
        })
        .catch(error => {
            console.error('Error adding community card:', error);
            alert('Failed to add community card.');
        });
}

function resetCommunityCards() {
    if (!confirm('Are you sure you want to reset community cards?')) {
        return;
    }

    fetch(`${BASE_URL}/reset-community-cards`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            fetchCommunityCards();
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

document.getElementById('resetButton').addEventListener('click', function () {
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
});

document.addEventListener('DOMContentLoaded', () => {
    fetchPlayers();
    fetchCommunityCards();
});
