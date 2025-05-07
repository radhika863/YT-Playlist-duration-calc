from flask import Flask, request, jsonify
import os
from dotenv import load_dotenv
from playlist_utils import get_playlist_duration
from playlist_handler import fetch_playlist_videos, fetch_video_durations, format_duration
from flask import render_template

load_dotenv()  # Load environment variables from .env file
app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    # Get the JSON data from the request
    data = request.get_json()
    
    #Extract the playlist URL from the JSON data
    playlist_url = data.get('playlist_url')      # this parameter is mandatory and is provided by the user
    
    #Extract the playback speed from the JSON data
    playback_speed = data.get('playback_speed')  # this parameter is optional and is provided by the user 
    
    # Call the helper function to get the playlist duration
    result, status_code = get_playlist_duration(playlist_url, playback_speed)
    
    # Return the result as JSON
    return jsonify(result), status_code

@app.route('/fetch_videos', methods=['POST'])
def fetch_videos():
    data = request.get_json()
    playlist_url = data.get('playlist_url')
    
    if not playlist_url:
        return jsonify({"error": "Playlist URL is required"}), 400
    
    
    
    api_key = os.getenv('YOUTUBE_API_KEY')
    if not api_key:
        return jsonify({"error": "API key is not found"}), 500
    
    
    try:
        playlist_id = playlist_url.split('list=')[1].split('&')[0]  # Extract the playlist ID from the URL
        videos = fetch_playlist_videos(api_key, playlist_id) # it's data type is list of dicts
        if not videos:
            return jsonify({"error": "No videos found in the playlist"}), 404

        video_ids = [video['id'] for video in videos] # Extract video IDs for fetching durations
        print("video IDs:", video_ids)
        durations = fetch_video_durations(api_key, video_ids)
        
        for video in videos:
            vid = video['id']
            info = durations.get(vid, {})
            seconds = info.get('duration', 0)
            video['duration_seconds'] = seconds
            video['formatted_duration'] = format_duration(seconds)
            video['video_link'] = f"https://www.youtube.com/watch?v={vid}"
            video['channel_title'] = info.get('channel_title', 'Unknown Channel')
        
        return jsonify({"videos": videos}), 200
    
    
    
    except Exception as e:
        print(f"Error in /fetch_videos: {e}")
        return jsonify({"error": "An error occurred while fetching videos"}), 500
    

@app.route('/calculate_selected', methods=['POST'])
def calculate_selected():
    data = request.get_json()
    video_ids = data.get('video_ids',[])
    durations = data.get('durations',{})
    playback_speed = data.get('playback_speed')
    
    if not video_ids:
        return jsonify({
        "total_seconds": 0,
        "formatted_duration": "00:00",
        "duration_at_different_speeds": {
            1.0: "00:00",
            1.25: "00:00",
            1.5: "00:00",
            1.75: "00:00",
            2.0: "00:00"
        }
    }), 200
    
    if not isinstance(durations, dict):
        return jsonify({"error": "Durations should be a dictionary."}), 400
    
    total_seconds = 0
    for vid in video_ids:
        total_seconds += durations.get(vid,0)
        
    famous_speeds = [1.0, 1.25, 1.5, 1.75, 2.0]
    all_speeds = []
    
    if playback_speed and playback_speed not in famous_speeds:
        all_speeds.append(playback_speed)
        
    all_speeds.extend(famous_speeds)
    all_speeds = list(dict.fromkeys(all_speeds))  # Remove duplicates while preserving order
    
    duration_at_different_speeds = {}
    for speed in all_speeds:
        adjusted = int(total_seconds / speed)
        h, rem = divmod(adjusted, 3600)
        m, s = divmod(rem, 60)
        duration_at_different_speeds[speed] = f"{h:02}:{m:02}:{s:02}"
        
    h, rem = divmod(int(total_seconds), 3600)
    m, s = divmod(rem, 60)
    formatted_duration = f"{h:02}:{m:02}:{s:02}"
    
    
    return jsonify({
        "total_seconds": total_seconds,
        "formatted_duration": formatted_duration,
        "duration_at_different_speeds": duration_at_different_speeds,
    }), 200
            
        















if __name__=='__main__':        # this is the main entry point of the application, like the anchor of a ship
    app.run(debug=True)
    
