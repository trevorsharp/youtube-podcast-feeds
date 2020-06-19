const config = require('./config.js');
const fs = require('fs');
const request = require('request');
const youtube = require('./utilities/youtube');
const downloader = require('./utilities/downloader');
const rss = require('./utilities/rss');

const workingDirectory = './data';

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

  feeds.map((feed) => {
    feed.videos.map((video) =>
      downloader.downloadContent(
        video.id,
        `${workingDirectory}/${feed.id}/content`
      )
    );

    rss.updateRssFeed(feed, `${workingDirectory}/${feed.id}`);
  });
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

  getFeedDataFromFile(directory)?.videos.map(
    (video) =>
      !feed.videos.some((v) => v.id === video.id) && feed.videos.push(video)
  );

  feed.videos = feed.videos
    .sort((a, b) => b.date - a.date)
    .splice(0, config.maxEpisodes);

  saveFeedDataToFile(feed, directory);

  removeOldContent(feed, `${directory}/content`);

  grabCoverArtAsync(feed, directory);

  return feed;
};

const getFeedDirectory = (feedId) => `${workingDirectory}/${feedId}`;

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

const removeOldContent = (feed, directory) => {
  if (fs.existsSync(directory)) {
    fs.readdir(directory, (_, files) =>
      files.map((file) => {
        if (
          !feed.videos
            .map((video) => video.id)
            .includes(`${file}`.replace('.mp4', ''))
        ) {
          fs.unlinkSync(`${directory}/${file}`);
        }
      })
    );
  }
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
