const config = require('./config.js');
const fs = require('fs');
const request = require('request');
const youtube = require('./utilities/youtube');
const downloader = require('./utilities/downloader');
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

  removeOldContent(feeds);

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
  const directory = getFeedDirectory(feed.id);

  // Merge new and existing video data
  getFeedDataFromFile(directory)?.videos.map(
    (video) =>
      !feed.videos.some((v) => v.id === video.id) && feed.videos.push(video)
  );

  feed.videos = feed.videos
    .sort((a, b) => b.date - a.date)
    .splice(0, config.maxEpisodes);

  saveFeedDataToFile(feed, directory);

  grabCoverArtAsync(feed, directory);

  return feed;
};

const getFeedDataFromFile = (directory) =>
  fs.readFile(getDataFilePath(directory), (err, data) =>
    err ? null : JSON.parse(data)
  );

const saveFeedDataToFile = (feed, directory) =>
  fs.writeFileSync(getDataFilePath(directory), JSON.stringify(feed));

const getDataFilePath = (directory) => {
  const file = `${directory}/feedData.json`;

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  return file;
};

const removeOldContent = (feeds) => {
  if (!fs.existsSync(contentDirectory)) {
    fs.mkdirSync(contentDirectory, { recursive: true });
  }

  const videoFiles = fs.readdirSync(contentDirectory);

  videoFiles.map(
    (file) =>
      !feeds.find((feed) =>
        feed.videos.map((video) => video.id).includes(file.replace('.mp4', ''))
      ) && fs.unlinkSync(`${contentDirectory}/${file}`)
  );
};

const grabCoverArtAsync = async (feed, directory) => {
  const file = `${directory}/cover.png`;
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
