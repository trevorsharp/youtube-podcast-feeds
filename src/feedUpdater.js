const fs = require('fs');
const axios = require('axios');
const youtube = require('./utilities/youtube');
const downloader = require('./utilities/downloader');
const cleanup = require('./utilities/cleanup');
const rss = require('./utilities/rss');
const { getFeedDirectory, feedConfigs, maxEpisodes } = require('./config');
const logger = require('./utilities/logger');

const run = async () => {
  const feeds = await Promise.all(
    feedConfigs.map(async (feed) => {
      const videos = await getVideosForFeedAsync(feed);
      return updateFeed({
        ...feed,
        videos,
      });
    })
  );

  cleanup.removeOldContent(feeds);

  downloader.downloadNewContent(feeds, () => {
    rss.updateRssFeeds(feeds);
    logger.log(`Update Complete`);
  });
};

const getVideosForFeedAsync = async (feed) =>
  []
    .concat(feed.user ? await youtube.getVideosByUsername(feed.user) : [])
    .concat(
      feed.channel ? await youtube.getVideosByChannelId(feed.channel) : []
    )
    .concat(
      feed.playlist ? await youtube.getVideosByPlaylistId(feed.playlist) : []
    )
    .filter((video) => (feed.filter ? video.title.match(feed.filter) : true));

const updateFeed = (feed) => {
  getFeedDataFromFile(feed.id)?.videos.map(
    (video) =>
      !feed.videos.some((v) => v.id === video.id) && feed.videos.push(video)
  );

  feed.videos
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .splice(maxEpisodes || feed.videos.length)
    .forEach((video) =>
      feed.cleanTitles
        ? (video.title = cleanTitle(video.title, feed.cleanTitles))
        : null
    );

  saveFeedDataToFile(feed);

  grabCoverArtAsync(feed);

  return feed;
};

const cleanTitle = (title, cleanTitlesConfig) => {
  var cleanTitle = title;

  cleanTitlesConfig.forEach((item) => {
    cleanTitle = cleanTitle
      .replace(new RegExp('(' + item[0].trim() + ')', 'gi'), item[1])
      .replace(/(^[\s|\-]+|[\s|\-]+$)/g, '')
      .replace(/([\s]+[\-]+[\s\-\|]+)/g, ' - ')
      .replace(/([\s]+[\|]+[\s\-\|]+)/g, ' | ')
      .replace(/\s+/g, ' ');
  });

  return cleanTitle;
};

const getFeedDataFromFile = (feedId) =>
  fs.existsSync(getDataFilePath(feedId))
    ? JSON.parse(fs.readFileSync(getDataFilePath(feedId)))
    : undefined;

const saveFeedDataToFile = (feed) =>
  fs.writeFileSync(getDataFilePath(feed.id), JSON.stringify(feed));

const getDataFilePath = (feedId) => {
  const file = `${getFeedDirectory(feedId)}/feedData.json`;

  if (!fs.existsSync(getFeedDirectory(feedId))) {
    fs.mkdirSync(getFeedDirectory(feedId), { recursive: true });
  }

  return file;
};

const grabCoverArtAsync = async (feed) => {
  const file = `${getFeedDirectory(feed.id)}/cover.png`;
  if (!fs.existsSync(file)) {
    const coverArtUrl =
      (feed.user && (await youtube.getCoverArtUrlByUsername(feed.user))) ||
      (feed.channel &&
        (await youtube.getCoverArtUrlByChannelId(feed.channel))) ||
      undefined;

    if (coverArtUrl) {
      axios
        .get(coverArtUrl, {
          responseType: 'stream',
        })
        .then((response) => response.data.pipe(fs.createWriteStream(file)));
    }
  }
};

module.exports = { run };
