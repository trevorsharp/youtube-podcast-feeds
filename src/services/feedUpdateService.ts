import fs from 'fs';
import { Feed, FeedConfig } from '../types';
import youtubeService from './youtubeService';
import downloadService from './downloadService';
import cleanupService from './cleanupService';
import rssService from './rssService';
import coverArtService from './coverArtService';
import config from '../utilities/config';
import log from '../utilities/log';

class FeedUpdateService {
  static updateFeeds = async () => {
    const feeds = await Promise.all(
      config.feedConfigs.map(async (feed: FeedConfig) => {
        const videos = await FeedUpdateService.getVideosForFeedAsync(feed);
        return FeedUpdateService.updateFeed({ ...feed, videos });
      })
    );

    cleanupService.removeOldContent(feeds);

    downloadService.downloadNewContent(feeds, () => {
      rssService.updateRssFeeds(feeds);
      log(`Update Complete`);
    });
  };

  private static getVideosForFeedAsync = async (feed: FeedConfig) =>
    [
      ...(feed.user ? await youtubeService.getVideosByUsername(feed.user) : []),
      ...(feed.channel ? await youtubeService.getVideosByChannelId(feed.channel) : []),
      ...(feed.playlist ? await youtubeService.getVideosByPlaylistId(feed.playlist) : []),
    ].filter((video) => (feed.filter ? video.title.match(new RegExp(feed.filter, 'gi')) : true));

  private static updateFeed = (feed: Feed) => {
    FeedUpdateService.getFeedDataFromFile(feed.id)?.videos.map(
      (video) => !feed.videos.some((v) => v.id === video.id) && feed.videos.push(video)
    );

    feed.videos
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .splice(config.maxEpisodes === 0 ? feed.videos.length : config.maxEpisodes);

    FeedUpdateService.saveFeedDataToFile(feed);

    coverArtService.downloadCoverArtAsync(feed);

    return feed;
  };

  private static getFeedDataFromFile = (feedId: string): Feed =>
    fs.existsSync(FeedUpdateService.getDataFilePath(feedId))
      ? JSON.parse(fs.readFileSync(FeedUpdateService.getDataFilePath(feedId), 'utf-8'))
      : undefined;

  private static saveFeedDataToFile = (feed: Feed) =>
    fs.writeFileSync(FeedUpdateService.getDataFilePath(feed.id), JSON.stringify(feed));

  private static getDataFilePath = (feedId: string): string => {
    const file = `${config.getFeedDirectory(feedId)}/${config.feedDataFileName}`;

    if (!fs.existsSync(config.getFeedDirectory(feedId)))
      fs.mkdirSync(config.getFeedDirectory(feedId), { recursive: true });

    return file;
  };
}

export default FeedUpdateService;
