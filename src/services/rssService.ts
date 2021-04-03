import fs from 'fs';
import Podcast from 'podcast';
import { Feed } from '../types';
import config from '../utilities/config';

class RssService {
  static updateRssFeeds = (feeds: Feed[]) => {
    feeds.map((feed) => {
      const rssFeed = new Podcast({
        title: feed.title,
        description: feed.title,
        author: feed.title,
        feedUrl: `${config.hostname}/${feed.id}/${config.rssFileName}`,
        siteUrl:
          (feed.channel && `https://www.youtube.com/channel/${feed.channel}`) ||
          (feed.user && `https://www.youtube.com/user/${feed.user}`) ||
          (feed.playlist && `https://www.youtube.com/playlist?list=${feed.playlist}`) ||
          '',
        imageUrl: `${config.hostname}/${feed.id}/${config.coverArtFileName}`,
      });

      feed.videos.map((video) => {
        var title = feed.cleanTitles
          ? RssService.cleanTitle(video.title, feed.cleanTitles)
          : video.title;

        title = feed.titleCase ? RssService.toTitleCase(title) : title;

        const episodeNumber =
          feed.episodeNumbers &&
          new RegExp(feed.episodeNumbers, 'gi').test(video.title) &&
          !isNaN(Number(RegExp.$1))
            ? { itunesEpisode: Number(RegExp.$1) }
            : {};

        rssFeed.addItem({
          title: title,
          itunesTitle: title,
          description: video.description,
          date: new Date(video.date),
          enclosure: { url: `${config.hostname}/content/${video.id}${config.contentFileExtension}` },
          url: `https://www.youtube.com/watch?v=${video.id}`,
          itunesDuration: video.duration,
          ...episodeNumber,
        });
      });

      if (!fs.existsSync(config.getFeedDirectory(feed.id))) {
        fs.mkdirSync(config.getFeedDirectory(feed.id), { recursive: true });
      }

      const file = `${config.getFeedDirectory(feed.id)}/${config.rssFileName}`;
      const contents = rssFeed.buildXml();
      fs.writeFileSync(file, contents);
    });
  };

  private static cleanTitle = (title: string, cleanTitlesConfig: string[][]) => {
    var cleanTitle = title;

    cleanTitlesConfig.forEach((item) => {
      cleanTitle = cleanTitle.replace(new RegExp(item[0], 'gi'), item[1]);
    });

    cleanTitle = cleanTitle
      .replace(/(^[\s|\-]+|[\s|\-]+$)/g, '')
      .replace(/([\s]+[\-]+[\s\-\|]+)/g, ' - ')
      .replace(/([\s]+[\|]+[\s\-\|]+)/g, ' | ')
      .replace(/\s+/g, ' ');

    return cleanTitle;
  };

  private static toTitleCase = (title: string) =>
    title
      .toLowerCase()
      .split(' ')
      .map((word) => word.replace(word[0], word[0].toUpperCase()))
      .join(' ');
}

export default RssService;
