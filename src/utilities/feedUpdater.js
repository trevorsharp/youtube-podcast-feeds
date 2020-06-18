const config = require('../../config.json');
const cleanup = require('./cleanup');
const rss = require('./rss');
const fs = require('fs');

const updateFeed = (feed, directory) => {
  getFeedDataFromFile(directory)?.videos.map(
    (video) =>
      !feed.videos.some((v) => v.id === video.id) && feed.videos.push(video)
  );

  feed.videos = feed.videos
    .sort((a, b) => b.date - a.date)
    .splice(0, config.maxEpisodes);

  saveFeedDataToFile(feed, directory);

  rss.generateRssFeed(feed, directory);

  cleanup.removeOldContent(feed, `${directory}/content`);

  return feed;
};

const getFeedDataFromFile = (directory) =>
  fs.readFile(getDataSaveFile(directory), (err, data) =>
    err ? null : JSON.parse(data)
  );

const saveFeedDataToFile = (feed, directory) =>
  fs.writeFileSync(getDataSaveFile(directory), JSON.stringify(feed));

const getDataSaveFile = (directory) => {
  const file = `${directory}/feedData.json`;

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  return file;
};

module.exports = {
  updateFeed,
};
