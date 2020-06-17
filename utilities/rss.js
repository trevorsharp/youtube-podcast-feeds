const config = require('../config');
const fs = require('fs');
const { Feed } = require('feed');

function generateRssFeed(feed, directory) {
  const rssFeed = new Feed({
    title: feed.title,
    description: feed.title,
    author: { name: feed.title },
    link: `${config.hostname}/${feed.id}/rss.xml`,
    image: `${config.hostname}/${feed.id}/cover.png`,
  });

  feed.videos.map((video) =>
    rssFeed.addItem({
      title: video.title,
      description: video.description,
      date: new Date(video.date),
      image: `${config.hostname}/${feed.id}/content/${video.id}.mp4`,
    })
  );

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }

  const file = `${directory}/rss.xml`;
  const contents = rssFeed.rss2();
  fs.writeFileSync(file, contents);
}

module.exports = { generateRssFeed };
