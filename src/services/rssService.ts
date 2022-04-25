import { Podcast } from 'podcast';
import feedService from './feedService';
import config from '../utilities/config';
import cache from '../utilities/cache';

class RssService {
  static clearCache = (feedId: string) => cache.delete(`rss-${feedId}`);

  static getRssFeed = (feedId: string) => {
    const cacheKey = `rss-${feedId}`;
    const cacheResult = cache.get(cacheKey);
    if (cacheResult) return cacheResult;

    const feed = feedService.getFeedData(feedId);

    if (!feed) return '';

    const rssFeed = new Podcast({
      title: feed.title,
      description: feed.title,
      author: feed.title,
      feedUrl: `${config.hostname}/${feed.id}`,
      siteUrl:
        (feed.channel && `https://www.youtube.com/channel/${feed.channel}`) ||
        (feed.user && `https://www.youtube.com/user/${feed.user}`) ||
        (feed.playlist && `https://www.youtube.com/playlist?list=${feed.playlist}`) ||
        '',
      imageUrl: `${config.hostname}/content/covers/${feed.id}/${config.coverArtFileName}`,
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

      const youtubeUrl = `https://youtu.be/${video.id}`;
      const videoUrl = `${config.hostname}/video/${video.id}`;

      const description = `${video.description.trim()}\n\n${youtubeUrl}`;

      const itunesDuration = video.duration;

      rssFeed.addItem({
        title: title,
        itunesTitle: title,
        description,
        date: new Date(video.date),
        enclosure: { url: videoUrl, type: 'video/mp4' },
        url: youtubeUrl,
        itunesDuration,
        ...episodeNumber,
      });
    });

    const rssContent = rssFeed.buildXml();

    cache.set(cacheKey, rssContent, config.updateInterval * 3600);

    return rssContent;
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
