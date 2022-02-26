import fs from 'fs';
import { Feed, FeedConfig, VideoItem, Video } from '../types';
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
    updatedVideos: VideoItem[]
  ): Promise<Feed> => {
    const existingVideos = FeedUpdateService.getFeedData(feedConfig.id)?.videos ?? [];

    const newVideos = updatedVideos.map((video) => {
      const existingVideo = existingVideos.find((v) => v.id === video.id);
      return existingVideo ? { ...video, duration: existingVideo.duration } : video;
    });

    const allVideos = newVideos.concat(
      existingVideos
        .filter((video) => newVideos.find((v) => v.id === video.id) === undefined)
        .map((i) => ({ ...i, dateAdded: i.date }))
    );

    const videos: Video[] = [];

    for (let i = 0; i < allVideos.length; i++) {
      if (allVideos[i].duration !== undefined) {
        const { date, dateAdded, ...rest } = allVideos[i];
        videos.push({ ...rest, date: feedConfig.sortByDateAdded ? dateAdded : date });
        continue;
      }

      const [videoDetails, isProcessed] = await youtubeService.getVideoDetails(allVideos[i].id);
      if (isProcessed) {
        const { date, ...rest } = videoDetails;
        videos.push({ ...rest, date: feedConfig.sortByDateAdded ? allVideos[i].dateAdded : date });
      }
    }

    videos.splice(feedConfig.maxEpisodes === 0 ? videos.length : feedConfig.maxEpisodes);
    videos.sort((a, b) => (a.date < b.date ? 1 : -1));

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
