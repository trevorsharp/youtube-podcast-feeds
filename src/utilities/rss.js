const fs = require('fs');
const Podcast = require('podcast');
const { getFeedDirectory, hostname } = require('../config');

const updateRssFeeds = (feeds) => {
  feeds.map((feed) => {
    const rssFeed = new Podcast({
      title: feed.title,
      description: feed.title,
      author: { name: feed.title },
      feedUrl: `${hostname}/${feed.id}/rss.xml`,
      siteUrl:
        (feed.channel && `https://www.youtube.com/channel/${feed.channel}`) ||
        (feed.user && `https://www.youtube.com/user/${feed.user}`) ||
        (feed.playlist &&
          `https://www.youtube.com/playlist?list=${feed.playlist}`) ||
        '',
      imageUrl: `${hostname}/${feed.id}/cover.png`,
    });

    feed.videos.map((video) =>
      rssFeed.addItem({
        title: video.title,
        description: video.description,
        date: new Date(video.date),
        enclosure: { url: `${hostname}/content/${video.id}.mp4` },
        url: `https://www.youtube.com/watch?v=${video.id}`,
        itunesDuration: video.duration,
      })
    );

    if (!fs.existsSync(getFeedDirectory(feed.id))) {
      fs.mkdirSync(getFeedDirectory(feed.id), { recursive: true });
    }

    const file = `${getFeedDirectory(feed.id)}/rss.xml`;
    const contents = rssFeed.buildXml();
    fs.writeFileSync(file, contents);
  });
};

module.exports = { updateRssFeeds };
