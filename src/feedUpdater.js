const config = require('./config.js');
const fs = require('fs');
const request = require('request');
const youtube = require('./utilities/youtube');
const downloader = require('./utilities/downloader');
const cleanup = require('./utilities/cleanup');
const rss = require('./utilities/rss');

const workingDirectory = './data';
const contentDirectory = `${workingDirectory}/content`;
const getFeedDirectory = (feedId) => `${workingDirectory}/${feedId}`;

const run = async () => {
  const feeds = await Promise.all(
    config.feeds.map(async (feed) => {
      const videos = await getVideosForFeedAsync(feed);
      return updateFeed({
        ...feed,
        videos,
      });
    })
  );

  cleanup.removeOldContent(feeds, contentDirectory);

  downloader.downloadNewContent(feeds, workingDirectory, contentDirectory, () =>
    rss.updateRssFeeds(feeds, workingDirectory)
  );
};

const getVideosForFeedAsync = async (feed) =>
  (
    (feed.user && (await youtube.getVideosByUsername(feed.user))) ||
    (feed.channel && (await youtube.getVideosByChannelId(feed.channel))) ||
    (feed.playlist && (await youtube.getVideosByPlaylistId(feed.playlist))) ||
    []
  )
    .filter((video) => (feed.regex ? video.title.match(feed.regex) : true))
    .map((video) =>
      feed.removeFromEpisodeTitles
        ? {
            ...video,
            title: video.title
              .replace(feed.removeFromEpisodeTitles.trim(), '')
              .trim()
              .replace(/  +/g, ' ')
              .replace(/(^(-|\|)|(-|\|)$)/g, '')
              .trim(),
          }
        : video
    );

const updateFeed = (feed) => {
  const feedDirectory = getFeedDirectory(feed.id);

  getFeedDataFromFile(feedDirectory)?.videos.map(
    (video) =>
      !feed.videos.some((v) => v.id === video.id) && feed.videos.push(video)
  );

  feed.videos
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .splice(config.maxEpisodes || feed.videos.length);

  saveFeedDataToFile(feed, feedDirectory);

  grabCoverArtAsync(feed, feedDirectory);

  return feed;
};

const getFeedDataFromFile = (feedDirectory) =>
  JSON.parse(fs.readFileSync(getDataFilePath(feedDirectory)));

const saveFeedDataToFile = (feed, feedDirectory) =>
  fs.writeFileSync(getDataFilePath(feedDirectory), JSON.stringify(feed));

const getDataFilePath = (feedDirectory) => {
  const file = `${feedDirectory}/feedData.json`;

  if (!fs.existsSync(feedDirectory)) {
    fs.mkdirSync(feedDirectory, { recursive: true });
  }

  return file;
};

const grabCoverArtAsync = async (feed, feedDirectory) => {
  const file = `${feedDirectory}/cover.png`;
  if (!fs.existsSync(file)) {
    const coverArtUrl =
      (feed.user && (await youtube.getCoverArtUrlByUsername(feed.user))) ||
      (feed.channel &&
        (await youtube.getCoverArtUrlByChannelId(feed.channel))) ||
      undefined;

    if (coverArtUrl) {
      request(coverArtUrl).pipe(fs.createWriteStream(file));
    }
  }
};

module.exports = { run };
