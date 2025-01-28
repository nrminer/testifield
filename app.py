from flask import Flask, jsonify, request, send_from_directory
import requests

app = Flask(__name__, static_folder='static')

# Distributor URL
DISTRIBUTOR_URL = "http://127.0.0.1:5000"

# Local state for players, including the dealer and community cards
poker_table = {
    "players": [
        {
            "name": "dealer",
            "cards": [
                {"value": "??", "hidden": True},
                {"value": "??", "hidden": True}
            ],
            "revealed": False
        }
    ],
    "community_cards": []  # Community cards
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

        updated_players = []
        for player_name in data.get("players", []):
            existing_player = next((p for p in poker_table["players"] if p["name"].lower() == player_name.lower()), None)
            if existing_player:
                updated_players.append(existing_player)
            else:
                updated_players.append({"name": player_name, "cards": [], "revealed": False})

        dealer = next((p for p in poker_table["players"] if p["name"].lower() == "dealer"), None)
        poker_table["players"] = [dealer] + updated_players

        return jsonify({"players": poker_table["players"]})
    except requests.RequestException as e:
        print(f"Error fetching players from distributor: {e}")
        return jsonify({"error": "Failed to fetch players"}), 500

@app.route('/assign-card', methods=['POST'])
def assign_card():
    global poker_table
    data = request.get_json()

    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    player_name = data.get("player_name")
    card = data.get("card")

    if not player_name or not card:
        return jsonify({"error": "Missing player name or card"}), 400

    for player in poker_table["players"]:
        if player["name"].lower() == player_name.lower():
            if player_name.lower() == "dealer":
                for dealer_card in player["cards"]:
                    if dealer_card["hidden"]:
                        dealer_card["value"] = card
                        dealer_card["hidden"] = not player["revealed"]
                        break
                else:
                    player["cards"].append({"value": card, "hidden": not player["revealed"]})
            else:
                player["cards"].append({"value": card})

            print(f"Updated {player_name}'s cards: {player['cards']}")
            return jsonify({"message": f"Card {card} assigned to {player_name}"}), 200

    return jsonify({"error": "Player not found"}), 404

@app.route('/assign-community-card', methods=['POST'])
def assign_community_card():
    global poker_table
    data = request.get_json()

    if not data or "card" not in data:
        return jsonify({"error": "Missing card in request"}), 400

    card = data["card"].strip()

    if not card:
        return jsonify({"error": "Card value cannot be empty"}), 400

    poker_table["community_cards"].append({"value": card, "hidden": False})

    return jsonify({
        "message": f"Community card {card} added",
        "community_cards": poker_table["community_cards"]
    }), 200

@app.route('/get-community-cards', methods=['GET'])
def get_community_cards():
    return jsonify({"community_cards": poker_table["community_cards"]})

@app.route('/reset-community-cards', methods=['POST'])
def reset_community_cards():
    global poker_table

    poker_table["community_cards"] = []

    return jsonify({
        "message": "Community cards reset",
        "community_cards": poker_table["community_cards"]
    }), 200

@app.route('/reset-game', methods=['POST'])
def reset_game():
    global poker_table, game_logs

    # Save the current state as a log
    log = {
        "players": poker_table["players"],
        "community_cards": poker_table["community_cards"]
    }
    game_logs.append(log)

    # Reset the poker table
    poker_table = {
        "players": [
            {
                "name": "dealer",
                "cards": [
                    {"value": "??", "hidden": True},
                    {"value": "??", "hidden": True}
                ],
                "revealed": False
            }
        ],
        "community_cards": []
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
