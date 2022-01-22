import fs from 'fs';
import { Feed, FeedConfig, Video } from '../types';
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
        return await FeedUpdateService.updateFeed(feed, videos);
      })
    );

    feeds.forEach((feed) => rssService.clearCache(feed.id));

    videoService.downloadNewContent(feeds, (didDownload: Boolean) => {
      if (didDownload) {
        cleanupService.removeOldContent(feeds);
      }

      log(`Update Complete${didDownload ? '' : ' - Skipped Downloads (Already In Progress)'}`);
    });
  };

  private static getVideosForFeedAsync = async (feed: FeedConfig) =>
    [
      ...(feed.user ? await youtubeService.getVideosByUsername(feed.user) : []),
      ...(feed.channel ? await youtubeService.getVideosByChannelId(feed.channel) : []),
      ...(feed.playlist ? await youtubeService.getVideosByPlaylistId(feed.playlist) : []),
    ].filter((video) => (feed.filter ? video.title.match(new RegExp(feed.filter, 'gi')) : true));

  private static updateFeed = async (
    feedConfig: FeedConfig,
    updatedVideos: Video[]
  ): Promise<Feed> => {
    const videos = FeedUpdateService.getFeedData(feedConfig.id)?.videos ?? [];

    await Promise.all(
      updatedVideos.map(async (video) => {
        const existingIndex = videos.findIndex((v) => v.id === video.id);

        if (existingIndex === -1) {
          const [videoDetails, isProcessed] = await youtubeService.getVideoDetails(video.id);
          if (isProcessed) videos.push(videoDetails);
          return;
        }

        const duration = videos[existingIndex].duration;
        videos[existingIndex] = {
          ...video,
          duration,
        };
      })
    );
    
    videos
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .splice(feedConfig.maxEpisodes === 0 ? videos.length : feedConfig.maxEpisodes);

    const feed = { ...feedConfig, videos };

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
