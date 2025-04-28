# YouTube Playlist Duration Calculator

A Flask-based backend API that calculates the total watch time of any YouTube playlist.

## Features
- Calculates total playlist watch time (hours, minutes, seconds)
- Supports custom playback speeds (1x, 1.25x, 1.5x, 1.75x, 2x, etc)
- Returns clean and detailed JSON responses
- Built using Flask, Python, YouTube Data API

## API Endpoint
- `POST /calculate`
- Body: JSON
  ```json
  {
    "playlist_url": "YOUR_PLAYLIST_LINK",
    "playback_speed": 1.5  // Optional
  }


## Sample Response
{
  "original_total_seconds": 7200,
  "original_duration": "2:00:00",
  "durations_at_speeds": {
    "1.0x": "2:00:00",
    "1.25x": "1:36:00",
    "1.5x": "1:20:00",
    "1.75x": "1:08:34",
    "2.0x": "1:00:00"
  }
}
