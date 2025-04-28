from flask import Flask, request, jsonify
from playlist_utils import get_playlist_duration

app = Flask(__name__)

@app.route('/')
def home():
    return "Hello, future playlist calculator!"

@app.route('/calculate', methods=['POST'])
def calculate():
    # Get the JSON data from the request
    data = request.get_json()
    
    
    #Extract the playlist URL from the JSON data
    playlist_url = data.get('playlist_url')      # this parameter is mandatory and is provided by the user
    
    #Extract the playback speed from the JSON data
    playback_speed = data.get('playback_speed')  # this parameter is optional and is provided by the user
    
    
    if not playlist_url:
        return jsonify({"error": "No playlist URL provided"}), 400
    
    
    # Call the helper function to get the playlist duration
    result = get_playlist_duration(playlist_url, playback_speed)
    
    # Return the result as JSON
    return jsonify(result)

if __name__=='__main__':        # this is the main entry point of the application, like the anchor of a ship
    app.run(debug=True)
    
