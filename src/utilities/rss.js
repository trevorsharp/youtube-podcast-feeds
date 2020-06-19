const config = require('../config.js');
const fs = require('fs');
const { Feed } = require('feed');

const updateRssFeed = (feed, feedDirectory) => {
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
      image: `${config.hostname}/content/${video.id}.mp4`,
    })
  );

  if (!fs.existsSync(feedDirectory)) {
    fs.mkdirSync(feedDirectory, { recursive: true });
  }

  const file = `${feedDirectory}/rss.xml`;
  const contents = rssFeed.rss2();
  fs.writeFileSync(file, contents);
};

module.exports = { updateRssFeed };
