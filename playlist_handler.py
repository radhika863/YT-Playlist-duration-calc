from googleapiclient.errors import HttpError
import isodate
import googleapiclient.discovery

def fetch_playlist_videos(api_key, playlist_id):
    youtube = googleapiclient.discovery.build("youtube", "v3", developerKey=api_key)
    videos = []
    next_page_token = None

    try:
        while True:
            request = youtube.playlistItems().list(
                part="snippet",
                playlistId=playlist_id,
                maxResults=50,
                pageToken=next_page_token
            )
            response = request.execute()

            for item in response['items']:
                snippet = item.get('snippet', {})
                resource_id = snippet.get('resourceId', {})
                video_id = resource_id.get('videoId')

                if not video_id:
                    # Skip private/deleted/unavailable video
                    continue

                title = snippet.get('title', 'Unknown Title')
                thumbnail_url = snippet.get('thumbnails', {}).get('default', {}).get('url', None)
                video_link = f"https://www.youtube.com/watch?v={video_id}"                

                videos.append({
                    'id': video_id, 
                    'title': title, 
                    'thumbnail_url': thumbnail_url,
                    'video_link': video_link,
                })


            next_page_token = response.get('nextPageToken')
            if not next_page_token:
                break
    except HttpError as e:
        print(f"An error occurred while fetching playlist videos: {e}")
    
    return videos

def fetch_video_durations(api_key, video_ids):
    youtube = googleapiclient.discovery.build("youtube", "v3", developerKey=api_key)
    durations = {}

    try:
        for i in range(0, len(video_ids), 50):
            request = youtube.videos().list(
                part="contentDetails,snippet",
                id=','.join(video_ids[i:i+50])
            )
            response = request.execute()

            for item in response['items']:
                video_id = item['id']
                duration_iso = item['contentDetails']['duration']
                duration_seconds = isodate.parse_duration(duration_iso).total_seconds()
                # durations[video_id] = duration_seconds.total_seconds()
                snippet = item.get('snippet', {})
                channel_title = snippet.get('channelTitle', 'Unknown Channel')
                
                durations[video_id] = {
                    'duration': duration_seconds,
                    'channel_title': channel_title
                }
    except HttpError as e:
        print(f"An error occurred: {e}")
    print("Video details fetched:", durations)
    return durations

def format_duration(seconds):
    seconds = int(seconds)
    hours, remainder = divmod(seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    return f"{hours:02}:{minutes:02}:{seconds:02}" if hours else f"{minutes:02}:{seconds:02}"