# youtube-podcast-feeds

Create podcast feeds from YouTube videos

## Features

- Generate RSS feeds that can be added to podcast apps with support for video podcasts (e.g. Apple Podcasts or Pocket Casts)
- Simple web server for serving RSS feed data and video files
- Download YouTube videos from channels, users, or playlists for higher quality

## Setup Using Docker

Prerequisites:

- Ensure docker is set up and running on your machine (https://docs.docker.com/get-docker)
- Set up a hostname that can be used to access your machine from the internet (can use a static IP address as well)
- Get a YouTube API v3 key (https://developers.google.com/youtube/v3/getting-started)

To run this application using docker:

1. Create a directory to store data files (can be on an external drive or NAS, which is handy when using the highQualityVideo option)
2. Create the configuration files as described below (`docker-compose.yml`, `config.json`, and optionally `cookies.txt`)
3. Run `docker-compose up -d` in the folder where your `docker-compose.yml` lives
4. Check the logs using `docker-compose logs -f` to see if there are any errors in your configuration
5. (Optional) - Replace `cover.png` files in the data directory with custom cover artwork (YouTube channel or user profile pictures are pulled automatically on first run)
6. Wait for the first update run to pull feed data and download any videos if applicable
7. Add podcast feeds to your podcast app of choice with the URL `http://hostname/feedId`

### docker-compose.yml

```
version: '3'
services:
  youtube-podcast-feeds:
    image: trevorsharp/youtube-podcast-feeds:latest
    container_name: youtube-podcast-feeds
    restart: always
    ports:
      - 80:80
    volumes:
      - REPLACE_WITH_CONFIG_DIRECTORY_PATH/config.json:/app/config.json
      - REPLACE_WITH_DATA_DIRECTORY_PATH:/app/data
      # Remove the following line if you are not using a cookies.txt file
      - REPLACE_WITH_COOKIES_DIRECTORY_PATH/cookies.txt:/app/cookies.txt
```

Create a file named `docker-compose.yml` with the contents above and substitute in the file path to your config files and the file path to your data directory.

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
      "filter" : "H3 Podcast #[0-9]+"
    }
  ]
}
```

Create a file named `config.json` with the contents above and fill in the following parameters:

- **hostname** - Hostname that will be used to access podcast feeds and content
- **apiKey** - YouTube API v3 key
- **feed.id** - Unique identifier for each feed (letters, numbers and hyphens only, no spaces)
- **feed.title** - Title for the podcast (read by podcast clients)

#### Feed Sources:

- **feed.channel** - YouTube channel id (from https://youtube.com/channel/CHANNEL_ID)
- **feed.user** - YouTube username (from https://youtube.com/user/USERNAME)
- **feed.playlist** - YouTube playlist id (from https://www.youtube.com/playlist?list=PLAYLIST_ID)

#### Optional Parameters:

- **timeZone** - Name of time zone used for logging - _Default: America/New_York_
- **updateInterval** - Interval for updating feeds (in hours) - _Default: 2_
- **maxResults** - Number of videos to search for when updating (per feed) - _Default: 5_
- **maxEpisodes** - Maximum number of videos to keep (per feed), useful when using the highQualityVideo option to limit storage usage - _Default: unlimited_
- **highQualityVideo** - If true, podcast feeds will default to downloading videos from YouTube into the data folder using the highest quality available in mp4 format (usually 1080p vs 720p without using this option). Will provide the lower quality version until the high quality version has downloaded. - _Default: false_

**WARNING:** Setting highQualityVideo to true will significantly increase the amount of storage space and CPU usage required to run

#### Optional Feed Parameters:

- **feed.highQualityVideo** - Overrides the global setting for a specific podcast feed - _Default: none / uses global setting_
- **feed.maxEpisodes** - Overrides the global setting for a specific podcast feed - _Default: none / uses global setting_
- **feed.filter** - String containing regex used to filter videos. Only videos with titles that have a match for this regex will be added to the feed - _Default: none_

See [Advanced Parameters](#advanced-parameters) for more options

**Note:** Regex are evaluated case insensitive. Be sure to double escape any backslashes (e.g. use `"\\s"` for a whitespace character instead of just `"\s"`)

### cookies.txt (Optional)

If you want to download YouTube content that requires user authentication to download, you will need to add a cookies.txt file to your configuration. One reason for needing this is to download members-only videos. Note that the source of these videos (channel, user, or playlist) still must be either public or unlisted. For members-only videos, I recommend going to the channel's home page and scrolling down to find an auto-generated playlist titled "Members-only videos" which will contain all the videos posted for members of the channel.

To generate this file:

1. Download the `Get cookies.txt` Chrome Extension found [here](https://chrome.google.com/webstore/detail/get-cookiestxt/bgaddhkoddajcdgocldbbfleckgcbcid)
2. Log in to YouTube
3. With a YouTube tab open, open the `Get cookies.txt` extension and click the export button
4. Rename the downloaded file to `cookies.txt`

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
 |
 └── feedId2
      └── cover.png
      └── feedData.json
 ...
```

## Advanced Parameters

- **addVideoLinksToDescription** - If true, the YouTube video url and the podcast feed's video url will be added to the end of every video's description - _Default: false_
- **feed.episodeNumbers** - String containing regex used to extract episode number from video title - _Default: no episode numbers_
- **feed.cleanTitles** - Array of 2-item sub-arrays where the first element of each sub-array is a regex to match part of an episode title and the second element is a string replacement for any matches found - _Default: empty_
- **feed.titleCase** - When set to true, episode titles are converted to title case - _Default: false_

#### Episode Numbers:

In these regex, you must place the leftmost set of parentheses around the actual episode number. For example, `"#([0-9]+)"` or `"Episode ([0-9]+)."` will work, but `"(#[0-9]+)"` or `"[0-9]+"` will not work.

_Example:_ `"Ep ([0-9]+)"` would be used to extract the episode number (`123`) from a video title that looks like this: `This is my podcast title | Ep 123`.

#### Clean Titles:

The string replacement (second element of the sub-array) can use the RegExp.$1-$9 properties (see [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/n) for more info on how these are used). Common separators (`-` and `|`) are cleaned up automatically.

_Example:_ `[["Podcast Name", ""], ["Ep ([0-9]+)", "#$1"]]` will transform `Podcast Episode Title | Podcast Name | Ep 123` into `Podcast Episode Title | #123`.

## Experimental Features

These features are experimental, and they may reduce compatibility, increase resource usage, and cause problems. Proceed with caution.

#### Additional Parameters

- **maxQualityVideo** - If true, video quality downloads will be allowed to exceed 1080p. Must be used in conjunction with `highQualityVideo` parameter set to true - _Default: false_
- **maxVideoHeight** - Number to represent the maximum height of downloaded videos in pixels. Must be used in conjunction with `maxQualityVideo` parameter set to true. Suggested values are 2160 and 1440 - _Default: 2160_
