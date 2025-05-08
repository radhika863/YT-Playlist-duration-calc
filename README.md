# YouTube Playlist Duration Calculator

A responsive web app that calculates the total watch time of YouTube playlists, watched at any custom speed.

## Try It Live

👉 [Click here to use the app](https://yt-playlist-duration-calc.onrender.com/)  

## How It Works

1. Paste any **YouTube playlist link** into the input field.
2. (Optional) Enter a custom **playback speed** like `1.5x` or `2x`.
3. The tool fetches all **public** videos in the playlist and lists them in a table.
4. You can **deselect videos** using:
   - Individual checkboxes
   - A range input like `3, 5-8`
5. It shows:
   - **Total watch time** adjusted for speed
   - **How many videos** are selected
6. Works beautifully on both **desktop and mobile**.

## Features

- Calculates total watch time at any playback speed
- Table with:
  - Video titles, thumbnails, durations, and uploader info
  - External video links
  - Select/deselect options
- Responsive design with mobile support
- Gracefully skips private/unavailable videos
- Shows total number of selected videos

## Tech Stack

- **Backend:** Flask (Python), YouTube Data API v3
- **Frontend:** HTML, CSS, Vanilla JS
- **Deployment:** Render

## Why I Built This

I often binge playlists for learning, but had no idea how long they'd take at faster speeds.  
This tool helps learners, binge-watchers, and planners estimate their time investment quickly.

Built with 💻 and 😤 by Radhika Singhal

