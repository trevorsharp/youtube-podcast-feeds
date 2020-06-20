const fs = require('fs');
const { Feed } = require('feed');
const { getFeedDirectory, hostname } = require('../config');

const updateRssFeeds = (feeds) => {
  feeds.map((feed) => {
    const rssFeed = new Feed({
      title: feed.title,
      description: feed.title,
      author: { name: feed.title },
      link: `${hostname}/${feed.id}/rss.xml`,
      image: `${hostname}/${feed.id}/cover.png`,
    });

    feed.videos.map((video) =>
      rssFeed.addItem({
        title: video.title,
        description: video.description,
        date: new Date(video.date),
        image: `${hostname}/content/${video.id}.mp4`,
      })
    );

    if (!fs.existsSync(getFeedDirectory(feed.id))) {
      fs.mkdirSync(getFeedDirectory(feed.id), { recursive: true });
    }

    const file = `${getFeedDirectory(feed.id)}/rss.xml`;
    const contents = rssFeed.rss2();
    fs.writeFileSync(file, contents);
  });
};

module.exports = { updateRssFeeds };
