# youtube-podcast-feeds

Create video podcast rss feeds for youtube channels, users, or playlists

## Setup

### config.json

```
{
  "hostname" : "https://example.com",
  "workingDirectory" : "./data",
  "apiKey" : "YOUTUBE_API_KEY",
  "maxEpisodes" : 3,
  "refreshInterval" : 3,
  "feeds" : [
    {
      "id" : "h3podcast",
      "title" : "H3 Podcast",
      "channel" : "UCLtREJY21xRfCuEKvdki1Kw",
      "regex" : "H3 Podcast #[0-9]+",
      "cleanTitle" : "H3 Podcast "
    }
  ]
}
```

- __hostname__ - Hostname that serves files in workingDirectory
- __workingDirectory__ - Directory that stores videos and rss files (Don't change when using docker-compose)
- __apiKey__ - YouTube API V3 Key
- __maxEpisodes__ - Maximum number of videos to keep per feed
- __refreshInterval__ - Interval for updating feeds (in hours)
- __feed.id__ - Unique identifier for the feed (RSS will be served at hostname/FEED-ID/rss.xml)
- __feed.title__ - Name of RSS feed

### Use One Per Feed
- __feed.channel__ - YouTube channel id (from https://youtube.com/channel/CHANNEL_ID)
- __feed.user__ - YouTube username (from https://youtube.com/user/USERNAME)
- __feed.playlist__ - YouTube playlist id (from https://www.youtube.com/playlist?list=PLAYLIST_ID)

### Optional
- __feed.regex__ - Videos are filtered by title with matching regex 
- __feed.cleanTitle__ - Exact matches of this string are removed from episode titles



### docker-compose.yml

```
version: '3'
services:
  youtube-podcast-feeds:
    image: trevorsharp/youtube-podcast-feeds:latest
    container_name: youtube-podcast-feeds
    restart: always
    volumes:
      - ./data:/usr/src/data
      - ./config.json:/usr/src/config.json
```
