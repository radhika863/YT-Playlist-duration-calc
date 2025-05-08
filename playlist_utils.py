from dotenv import load_dotenv
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import isodate                                      # for parsing ISO 8601 duration
import json, requests, datetime, os

# Load environment variables from .env file
load_dotenv() 

# Get the API key from environment variables and raise an error if not found
# os.getenv() is a method that retrieves the value of an environment variable.
# here os is a module that provides a way of using operating system dependent functionality like reading environment variables
API_KEY = os.getenv('YOUTUBE_API_KEY')  
if not API_KEY:
    raise ValueError("API key not found. Please set the YOUTUBE_API_KEY environment variable.")


# Initialize the YouTube API client
# build() is a method that creates a resource object for interacting with the YouTube API
# here 'youtube' is the name of the service, 'v3' is the version of the API, and developerKey is the API key we just retrieved
# build() returns a resource object that can be used to call the API methods
# youtube is a variable that holds the resource object for the YouTube API
youtube = build('youtube', 'v3', developerKey=API_KEY)


def clean_playlist_id(playlist_url):
    if not playlist_url:
        return None
    playlist_url = playlist_url.strip()
    
    if "list=" in playlist_url:
        playlist_id = playlist_url.split("list=")[1].split("&")[0]
    else:
        playlist_id = playlist_url

    # Critical clean step
    playlist_id = playlist_id.strip().replace(' ', '').replace('+', '')

    return playlist_id


# Function to fetch all video durations from a YouTube playlist and calculate the total duration
# This function takes a playlist URL and an optional playback speed as input which is set to None by default as the user may not provide it
# and returns a dictionary containing the total duration in seconds, a human-readable format, and the duration at different playback speeds
# The function uses the YouTube Data API to fetch the playlist items and their details, including the video IDs and durations
# and uses the datetime library to format the total duration in a human-readable format

# for extra space in the input field, remove the spaces and plus signs from the playlist ID

def get_playlist_duration(playlist_url, playback_speed=None):
    """
    Fetches all video durations from a YouTube playlist and calculates the total duration.
    Supports playback speed adjustment.
    """
     
    if not playlist_url:
        return {"error":"No playlist URL provided."}, 400
    
    if not ("youtube.com/playlist" in playlist_url):
        return {"error": "Invalid playlist URL. Please provide a valid YouTube playlist URL."}, 400
    
    # Extract the playlist ID from the URL
    playlist_id = clean_playlist_id(playlist_url)

    if not playlist_id:
        return {"error": "Invalid YouTube playlist URL"}, 400

    print(f"🧪 Using cleaned playlist_id: '{playlist_id}'")

    
    
    # Fetch all videos in the playlist
    total_seconds = 0
    next_page_token = None
    
    # Loop through all pages of the playlist where the part is contentDetails which is the only part that contains the videoId
    # and the maxResults is set to 50 which is the maximum number of results per page
    # and the pageToken is used to get the next page of results
    # and the playlistId is the ID of the playlist we want to fetch
    # The loop continues until there are no more pages of results and it knows that by checking if the nextPageToken is None
    # The loop fetches the playlist items in batches of 50 and processes each batch to extract the video IDs
    # and then fetches the video details for those IDs to get the duration
    print(f"▶️ Final playlistId sent to YouTube: '{playlist_id}'")

    try:
        while True:
            playlist_items = youtube.playlistItems().list(
                part='contentDetails',
                playlistId=playlist_id,
                pageToken=next_page_token,
                maxResults=50  
            ).execute() # execute() is a method that sends the request to the API and returns the response
            print(f"📦 YouTube API response: {playlist_items}")

            video_ids = [item['contentDetails']['videoId'] for item in playlist_items['items']] # this is a list comprehension that extracts the video IDs from the playlist items

            if not video_ids:
                return {"error" : "No videos found in the playlist."}, 404
            
            #fetch video details for the current batch of video IDs
            video_details = youtube.videos().list(
                part='contentDetails',
                id=','.join(video_ids)
            ).execute()
            
            for video in video_details['items']:
                duration = video['contentDetails']['duration']
                # Parse the ISO 8601 duration format
                duration_seconds = isodate.parse_duration(duration).total_seconds()
                total_seconds += duration_seconds
            
            # Check if there are more pages of results
            next_page_token = playlist_items.get('nextPageToken')
            if not next_page_token:
                break
    
    
    except HttpError as e:
        
        error_reason = e.error_details[0]['reason'] if hasattr(e, 'error_details') else None
        
        if e.resp.status == 404:
            return {"error": "Playlist not found or private."}, 404
        elif e.resp.status == 403:
            return {"error" : "Quota exceeded or access denied due to a private playlist."}, 403
        else:
            return {"error": "YouTube API error"}, 500
        
    except Exception as e:
        print(f"An error occurred: {e}")
        return {"error": "Internal server error"}, 500
    
    #Famous default playback speeds
    famous_playback_speeds = [1.0, 1.25, 1.5, 1.75, 2.0]
    final_playback_speed = []
        
    #If user provided a custom speed, and it's not in the famous list, show it first
    if playback_speed and playback_speed not in famous_playback_speeds:
        final_playback_speed.append(playback_speed)
            
    #Always show the famous speeds after the custom speed
    final_playback_speed.extend(famous_playback_speeds)
        
    # remove duplicates (if user provided a famous speed) 
    # and keep the order of the list using dict.fromkeys()
    final_playback_speed = list(dict.fromkeys(final_playback_speed))
        
    # Build duration at different speeds
    duration_at_different_speeds = {}
        
    #this is the final result that will be returned to the user for famous speed and custom speed
    
    for speed in final_playback_speed:
        adjusted_seconds = total_seconds / speed
        adjusted_duration_td = datetime.timedelta(seconds=adjusted_seconds)

        total_seconds_int = int(adjusted_duration_td.total_seconds())
        hours, remainder = divmod(total_seconds_int, 3600)
        minutes, seconds = divmod(remainder, 60)

        formatted_duration = f"{hours}:{minutes:02}:{seconds:02}"

        duration_at_different_speeds[speed] = formatted_duration

    
    

        
    return {
        'total_seconds': total_seconds,
        'total_duration': str(datetime.timedelta(seconds=total_seconds)),
        'duration_at_different_speeds': duration_at_different_speeds
    }, 200

    
   