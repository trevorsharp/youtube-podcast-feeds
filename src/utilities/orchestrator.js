const config = require('../../config.json');
const youtube = require('./youtube');
const downloader = require('./downloader');
const feedUpdater = require('./feedUpdater');

const workingDirectory = './data';

const runUpdate = async () => {
  // Get updated videos from YouTube
  var feeds = await Promise.all(
    config.feeds.map(async (feed) => {
      return {
        ...feed,
        videos: (
          (feed.user && (await youtube.getVideosByUsername(feed.user))) ||
          (feed.channel &&
            (await youtube.getVideosByChannelId(feed.channel))) ||
          (feed.playlist &&
            (await youtube.getVideosByPlaylistId(feed.playlist))) ||
          []
        )
          .filter((video) =>
            feed.regex ? video.title.match(feed.regex) : true
          )
          .map((video) =>
            feed.removeFromEpisodeTitles
              ? {
                  ...video,
                  title: video.title
                    .replace(feed.removeFromEpisodeTitles.trim(), '')
                    .trim()
                    .replace('[\\s]+', ' ')
                    .replace('(^(-||)|(-||)$)', '')
                    .trim(),
                }
              : video
          ),
      };
    })
  );

  // Update feed data
  feeds = feeds.map((feed) =>
    feedUpdater.updateFeed(feed, `${workingDirectory}/${feed.id}`)
  );

  // Download new content
  feeds.map((feed) =>
    feed.videos.map((video) =>
      downloader.downloadContent(
        video.id,
        `${workingDirectory}/${feed.id}/content`
      )
    )
  );

  console.log(`${new Date().toLocaleString()} - Update Complete`);
};

module.exports = { runUpdate };
