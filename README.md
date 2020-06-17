# youtube-podcast-feeds

Create video podcast rss feeds for youtube channels, users, or playlists

## Setup

### config.js

```
module.exports = {
  hostname: 'https://example.com',              // Hostname that serves files in workingDirectory
  workingDirectory: './data',                   // Directory that stores videos and rss files
  apiKey: 'YOUTUBE_API_KEY',
  fetchSize: 15,                                // Maximum number of videos to search for per feed
  maxEpisodes: 3,                               // Maximum number of videos to keep per feed
  refreshInterval: 3,                           // Interval for updating feeds (in hours)
  feeds: [
    {
      id: 'h3podcast',                          // Unique identifier for the feed
      title: 'H3 Podcast',                      // Name of RSS feed
      channel: 'UCLtREJY21xRfCuEKvdki1Kw',      // Use channel, user, or playlist to specify source
      // user: "username",
      // playlist: "playlist_id",
      regex: 'H3 Podcast #[0-9]+',              // Filter videos by title with matching regex (Optional)
      cleanTitle: "H3 Podcast ",                // Remove this string from episode titles (Optional)
    },
  ],
};
```

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
      - ./config.js:/usr/src/config.js
```
