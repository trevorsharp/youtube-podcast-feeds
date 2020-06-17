const config = require('../config.json');
const youtube = require('./youtube');
const downloader = require('./downloader');
const cleanup = require('./cleanup');
const rss = require('./rss');

async function updateFeeds() {
  // Get updated videos from YouTube
  const feeds = await Promise.all(
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
            feed.cleanTitle
              ? { ...video, title: video.title.replace(feed.cleanTitle, '') }
              : video
          )
          .slice(0, config.maxEpisodes),
      };
    })
  );

  // Update RSS feeds
  feeds.map((feed) =>
    rss.generateRssFeed(feed, `${config.workingDirectory}/${feed.id}`)
  );

  // Cleanup old content
  cleanup.removeOldContent(feeds);

  // Download new content
  feeds.map((feed) =>
    feed.videos.map((video) =>
      downloader.downloadContent(
        video.id,
        `${config.workingDirectory}/${feed.id}/content`
      )
    )
  );

  console.log(`${new Date().toLocaleString()} - Update Complete`);
}

module.exports = { updateFeeds };
