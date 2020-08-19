# youtube-podcast-feeds

Create video podcast feeds from YouTube videos

## Features

- Download YouTube videos from channels, users, or playlists
- Generate RSS feeds that can be added to podcast apps with support for video podcasts (e.g. Apple Podcasts)
- Simple web server for hosting RSS feeds and video files

## Setup Using Docker

Prerequisites:

- Ensure docker is set up and running on your machine (https://docs.docker.com/get-docker)
- Set up a hostname that can be used to access your machine from the internet (can use a static IP address as well)
- Get a YouTube API v3 key (https://developers.google.com/youtube/v3/getting-started)

To run this application using docker:

1. Create a directory to store data files (can be on an external drive or NAS)
2. Create the configuration files as described below (`docker-compose.yml`, `config.json`, `nginx.conf`, and optionally `cookie.txt`)
3. Run `docker-compose up -d` in the folder where your `docker-compose.yml` lives
4. Check the logs using `docker-compose logs -f` to see if there are any errors in your configuration
5. (Optional) - Replace `cover.png` files in the data directory with custom cover artwork (YouTube channel or user profile pictures are pulled automatically on first run)
6. Wait for the first update run to complete all downloads
7. Add podcast feeds to your podcast app of choice with the URL `http://hostname/feedId`

### docker-compose.yml

```
version: '3'
services:
  youtube-podcast-feeds:
    image: trevorsharp/youtube-podcast-feeds:latest
    container_name: youtube-podcast-feeds
    restart: always
    volumes:
      - REPLACE_WITH_CONFIG_DIRECTORY_PATH/config.json:/app/config.json
      - REPLACE_WITH_DATA_DIRECTORY_PATH:/app/data
      # Remove the following line if you are not using a cookies.txt file
      - REPLACE_WITH_COOKIE_DIRECTORY_PATH/cookies.txt:/app/cookies.txt
  youtube-podcast-feeds-webserver:
    image: nginx:alpine
    restart: always
    container_name: youtube-podcast-feeds-webserver
    ports:
      - 80:80
    volumes:
      - REPLACE_WITH_CONFIG_DIRECTORY_PATH/nginx.conf:/etc/nginx/nginx.conf
      - REPLACE_WITH_DATA_DIRECTORY_PATH:/app/data
```

Create a file named `docker-compose.yml` with the contents above and substitute in the file path to your config files and the file path to your data directory.

**Note:** The docker image in the file above is for x86_64 architecture. For an arm64 version of the container, add `-arm64` to the end of the container's tag (`trevorsharp/youtube-podcast-feeds:latest-arm64`).

### config.json

```
{
  "hostname" : "http://example.com",
  "apiKey" : "YOUTUBE_API_KEY",
  "timeZone" : "America/New_York",
  "updateInterval" : 2,
  "maxResults": 5,
  "maxEpisodes" : 10,
  "feeds" : [
    {
      "id" : "h3podcast",
      "title" : "H3 Podcast",
      "channel" : "UCLtREJY21xRfCuEKvdki1Kw",
      "filter" : "H3 Podcast #[0-9]+",
      "cleanTitles" : [["H3 Podcast", ""]]
    }
  ]
}
```

Create a file named `config.json` with the contents above and fill in the following parameters:

- **hostname** - Hostname that will be used to access podcast feeds and content
- **apiKey** - YouTube API v3 key
- **feed.id** - Unique identifier for each feed (letters and numbers only, no spaces)
- **feed.title** - Title for the podcast (read by podcast clients)

#### Feed Sources:

- **feed.channel** - YouTube channel id (from https://youtube.com/channel/CHANNEL_ID)
- **feed.user** - YouTube username (from https://youtube.com/user/USERNAME)
- **feed.playlist** - YouTube playlist id (from https://www.youtube.com/playlist?list=PLAYLIST_ID)

### Optional Parameters:

- **timeZone** - Name of time zone used for logging - _Default: America/New_York_
- **updateInterval** - Interval for updating feeds (in hours) - _Default: 2_
- **maxResults** - Number of videos to search for when updating (per feed) - _Default: 5_
- **maxEpisodes** - Maximum number of videos to keep (per feed) - _Default: unlimited_
- **feed.filter** - Only videos that have a match for this regex will be added to the feed - _Default: none_
- **feed.cleanTitles** - A list of 2-item arrays where the first element is a regex to match part of an episode title and the second is a regex replacement for any matches found - _Default: empty_  
  For Example: `[["H3 Podcast", ""], ["Episode", "Ep"]]` will remove all instances of "H3 Podcast" from the title and replace any instances of "Episode" with "Ep" in the title

_For regex, be sure to double escape any backslashes_ (i.e. `"\\s"` for a whitespace character)

### nginx.conf

```
events {}
http {
  server {
    listen 80;
    server_name _;

    location / {
      root /app/data;
      index rss.xml;
    }
  }
}
```

Create a file named `nginx.conf` with the contents above. If you are hosting other web services on the machine, you will likely need to customize the nginx config to work alongside those other services (or use a different port by changing the port configuration in your `docker-compose.yml`).

### cookies.txt (Optional)

If you want to download YouTube content that requires user authentication to download, you will need to add a cookies.txt file to your configuration. One reason for needing this is to download member-only videos. Note that the source of these videos (channel, user, or playlist) still must be either public or unlisted. For member-only videos, I recommend creating an unlisted playlist and manually adding the videos that you want to have available in the podcast feed.

To generate this file:

1. Download the cookies.txt Chrome Extension found [here](https://chrome.google.com/webstore/detail/cookiestxt/njabckikapfpffapmjgojcnbfjonfjfg)
2. Log in to YouTube
3. Open the cookies.txt extension and copy the entire contents
4. Paste the contents into a file named `cookies.txt`

## Data Directory Structure

Files will be stored in the data directory using the following structure:

```
data
 |
 └── content
 |    └── videoId1.mp4
 |    └── videoId2.mp4
 |    └── videoId3.mp4
 |        ...
 |
 └── feedId1
 |    └── cover.png
 |    └── feedData.json
 |    └── rss.xml
 |
 └── feedId2
      └── cover.png
      └── feedData.json
      └── rss.xml
 ...
```
