# youtube-podcast-feeds

Create video podcast rss feeds for youtube channels, users, or playlists

## Setup

### config.json

```
{
  "timeZone" : "America/New_York",
  "hostname" : "https://example.com",
  "apiKey" : "YOUTUBE_API_KEY",
  "updateInterval" : 2,
  "maxEpisodes" : 10,
  "feeds" : [
    {
      "id" : "h3podcast",
      "title" : "H3 Podcast",
      "channel" : "UCLtREJY21xRfCuEKvdki1Kw",
      "regex" : "H3 Podcast #[0-9]+",
      "removeFromEpisodeTitles" : "H3 Podcast"
    }
  ]
}
```

- **timeZone** - Name of time zone used for logging
- **hostname** - Hostname that will serve the files in data folder
- **apiKey** - YouTube API V3 Key
- **updateInterval** - Interval for updating feeds (in hours)
- **maxEpisodes** - Maximum number of videos to keep per feed
- **feed.id** - Unique identifier for each feed (podcast RSS feed will be served at hostname/FEED-ID/rss.xml)
- **feed.title** - Name of RSS feed

### Use One Per Feed

- **feed.channel** - YouTube channel id (from https://youtube.com/channel/CHANNEL_ID)
- **feed.user** - YouTube username (from https://youtube.com/user/USERNAME)
- **feed.playlist** - YouTube playlist id (from https://www.youtube.com/playlist?list=PLAYLIST_ID)

### Optional

- **feed.regex** - Videos are filtered by title with matching regex
- **feed.removeFromEpisodeTitles** - Matches of this string are removed from episode titles

### docker-compose.yml

```
version: '3'
services:
  youtube-podcast-feeds:
    image: trevorsharp/youtube-podcast-feeds:latest
    container_name: youtube-podcast-feeds
    restart: always
    volumes:
      - ./config.json:/app/config.json
      - ./data:/app/data
  youtube-podcast-feeds-webserver:
    image: nginx:alpine
    restart: always
    container_name: youtube-podcast-feeds-webserver
    ports:
      - 80:80
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./data:/app/data
```

### nginx.conf

```
http {
  server {
    listen 80;
    server_name example.com www.example.com;

    location / {
      root /app/data;
      index rss.xml;
    }
  }
}
```
