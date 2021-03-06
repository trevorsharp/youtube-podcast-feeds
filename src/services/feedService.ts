import fs from 'fs';
import { Feed, FeedConfig } from '../types';
import youtubeService from './youtubeService';
import videoService from './videoService';
import rssService from './rssService';
import cleanupService from './cleanupService';
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

    feeds.forEach((feed) => rssService.clearCache(feed.id));

    cleanupService.removeOldContent(feeds);
    videoService.downloadNewContent(feeds, () => {
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
    FeedUpdateService.getFeedData(feed.id)?.videos.map(
      (video) => !feed.videos.some((v) => v.id === video.id) && feed.videos.push(video)
    );

    const maxEpisodes = feed.maxEpisodes != undefined ? feed.maxEpisodes : config.maxEpisodes;

    feed.videos
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .splice(maxEpisodes === 0 ? feed.videos.length : maxEpisodes);

    FeedUpdateService.saveFeedData(feed);

    coverArtService.downloadCoverArtAsync(feed);

    return feed;
  };

  static getFeedData = (feedId: string): Feed =>
    fs.existsSync(FeedUpdateService.getDataFilePath(feedId))
      ? JSON.parse(fs.readFileSync(FeedUpdateService.getDataFilePath(feedId, true), 'utf-8'))
      : undefined;

  private static saveFeedData = (feed: Feed) =>
    fs.writeFileSync(FeedUpdateService.getDataFilePath(feed.id, true), JSON.stringify(feed));

  private static getDataFilePath = (
    feedId: string,
    createDirectoryIfNecessary: boolean = false
  ): string => {
    const file = `${config.getFeedDirectory(feedId)}/${config.feedDataFileName}`;

    if (createDirectoryIfNecessary && !fs.existsSync(config.getFeedDirectory(feedId)))
      fs.mkdirSync(config.getFeedDirectory(feedId), { recursive: true });

    return file;
  };
}

export default FeedUpdateService;
