from flask import Flask, jsonify, request, send_from_directory
import requests
import re

app = Flask(__name__, static_folder='static')

# Distributor URL
DISTRIBUTOR_URL = "http://127.0.0.1:5000"

# Local state for players, including the dealer and community cards
poker_table = {
    "players": [
        {
            "name": "community",  # Community cards go first
            "cards": [
                {"value": "??", "hidden": True},
                {"value": "??", "hidden": True},
                {"value": "??", "hidden": True},
                {"value": "??", "hidden": True},
                {"value": "??", "hidden": True},
            ],  # Initially 5 community cards
            "revealed": False
        },
        {
            "name": "dealer",
            "cards": [
                {"value": "??", "hidden": True},
                {"value": "??", "hidden": True}
            ],  # Initially 2 dealer cards
            "revealed": False
        }
    ]
}

# Add a global log for game resets
game_logs = []

@app.route('/static/images/<path:filename>')
def serve_image(filename):
    return send_from_directory('static/images', filename)


@app.route('/view-logs', methods=['GET'])
def view_logs():
    return jsonify({"logs": game_logs})

@app.route('/get-players', methods=['GET'])
def get_players():
    try:
        response = requests.get(f"{DISTRIBUTOR_URL}/get-players")
        response.raise_for_status()
        data = response.json()

        # Get existing players, ignoring dealer & community for now
        updated_players = [
            p for p in poker_table["players"]
            if p["name"].lower() not in ["community", "dealer"]
        ]

        # Add new players from the distributor (ignore duplicates)
        for player_name in data.get("players", []):
            if not any(p["name"].lower() == player_name.lower() for p in updated_players):
                updated_players.append({"name": player_name, "cards": [], "revealed": False})

        # Ensure Dealer is at the top
        dealer_player = next((p for p in poker_table["players"] if p["name"].lower() == "dealer"), None)
        if not dealer_player:
            dealer_player = {
                "name": "dealer",
                "cards": [{"value": "??", "hidden": True}, {"value": "??", "hidden": True}],
                "revealed": False
            }

        # Ensure Community is just below the dealer
        community_player = next((p for p in poker_table["players"] if p["name"].lower() == "community"), None)
        if not community_player:
            community_player = {
                "name": "community",
                "cards": [{"value": "??", "hidden": True} for _ in range(5)],
                "revealed": False
            }

        # Final order: Dealer → Community → Other Players
        poker_table["players"] = [dealer_player, community_player] + updated_players

    except requests.RequestException as e:
        print(f"Error fetching players from distributor: {e}")

    return jsonify({"players": poker_table["players"]})


@app.route('/get-active-players', methods=['GET'])
def get_active_players():
    try:
        # Get all players (including community and dealer)
        all_players = poker_table["players"]
        
        # Return the players in JSON format
        return jsonify({"players": all_players})

    except Exception as e:
        return jsonify({"error": f"Error fetching active players: {str(e)}"}), 500

@app.route('/assign-card', methods=['POST'])
def assign_card():
    global poker_table
    data = request.get_json()
    
    # Validate the request for the card and player
    if not data or "player_name" not in data or "card" not in data:
        return jsonify({"error": "Missing player name or card in request"}), 400
    
    player_name = data["player_name"].strip().lower()  # Ensure player name is lowercase
    card = data["card"].strip()
    
    # Validate card format
    if not re.match(r'^[2-9TJQKA]{1}[CDHS]{1}$', card):
        return jsonify({"error": f"Invalid card format: {card}"}), 400
    
    # Find the player (either community, dealer, or any other player)
    player = next((p for p in poker_table["players"] if p["name"].lower() == player_name), None)
    if not player:
        return jsonify({"error": "Player not found"}), 404
    
    # **Community Assignment** (Replace ?? with the new card)
    if player_name == "community":
        for i in range(len(player["cards"])):
            if player["cards"][i]["value"] == "??":
                player["cards"][i] = {"value": card, "hidden": False}  # Replace a hidden card
                return jsonify({"message": f"Card {card} assigned to community", "players": poker_table["players"]}), 200
        return jsonify({"error": "Community already has 5 cards"}), 400
    
    # **Dealer Assignment** (Replace ?? with the new card)
    elif player_name == "dealer":
        for i in range(len(player["cards"])):
            if player["cards"][i]["value"] == "??":
                player["cards"][i] = {"value": card, "hidden": not player["revealed"]}  # Replace a hidden card
                return jsonify({"message": f"Card {card} assigned to dealer", "players": poker_table["players"]}), 200
        return jsonify({"error": "Dealer already has 2 cards"}), 400
    
    # **Regular Players**
    else:
        player["cards"].append({"value": card, "hidden": False})
    
    return jsonify({
        "message": f"Card {card} assigned to {player_name}",
        "players": poker_table["players"]
    }), 200

@app.route('/players_cards', methods=['GET'])
def get_players_cards():
    players_cards = {
        "Player1": ["2H", "3D"],
        "Player2": ["5S", "AH"]
    }
    return jsonify({"playersCards": players_cards})

# Reset Game Endpoint: Ensure dealer is properly added
@app.route('/reset-game', methods=['POST'])
def reset_game():
    global poker_table, game_logs

    # Save the current state as a log
    game_logs.append({
        "players": poker_table["players"]
    })

    # Reset game ensuring the correct order
    poker_table = {
        "players": [
            {
                "name": "community",
                "cards": [{"value": "??", "hidden": True} for _ in range(5)],  # 5 initial community cards
                "revealed": False
            },
            {
                "name": "dealer",
                "cards": [{"value": "??", "hidden": True}, {"value": "??", "hidden": True}],  # 2 dealer cards
                "revealed": False
            }
        ]
    }

    return jsonify({
        "message": "Game has been reset",
        "poker_table": poker_table,
        "logs": game_logs
    }), 200

@app.route('/reveal-dealer', methods=['POST'])
def reveal_dealer():
    global poker_table
    data = request.get_json()

    if not data or "revealed" not in data:
        return jsonify({"error": "Missing 'revealed' status"}), 400

    for player in poker_table["players"]:
        if player["name"].lower() == "dealer":
            player["revealed"] = data["revealed"]
            for card in player["cards"]:
                card["hidden"] = not data["revealed"]

            return jsonify({
                "message": "Dealer reveal status updated",
                "dealer": player
            }), 200

    return jsonify({"error": "Dealer not found"}), 404

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'poker_tracker.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
