import { google, youtube_v3 } from 'googleapis';
import * as moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
import { Video } from '../types';
import config from '../utilities/config';
import log from '../utilities/log';
import cache from '../utilities/cache';

class YouTubeService {
  static instance: YouTubeService;
  private youtube: youtube_v3.Youtube;

  private constructor() {
    momentDurationFormatSetup(moment);
    this.youtube = google.youtube({ version: 'v3', auth: config.apiKey });
  }

  static getInstance(): YouTubeService {
    if (!YouTubeService.instance) YouTubeService.instance = new YouTubeService();
    return YouTubeService.instance;
  }

  getVideosByUsername = async (username: string) => {
    const cacheKey = `plalist-id-for-username-${username}`;

    const playlistId =
      cache.get(cacheKey) ??
      (await this.youtube.channels
        .list({ part: ['contentDetails'], forUsername: username })
        .then(
          (response) => response?.data?.items?.shift()?.contentDetails?.relatedPlaylists?.uploads,
          () => {
            log(`Could not find YouTube username (${username})`);
            process.exit();
          }
        )
        .then((playlistId) => {
          if (playlistId) cache.set(cacheKey, playlistId, 86400);
          return playlistId;
        }));

    return playlistId ? await this.getVideosByPlaylistId(playlistId) : [];
  };

  getVideosByChannelId = async (channelId: string) => {
    const cacheKey = `plalist-id-for-channel-${channelId}`;

    const playlistId =
      cache.get(cacheKey) ??
      (await this.youtube.channels
        .list({ part: ['contentDetails'], id: [channelId] })
        .then(
          (response) => response?.data?.items?.shift()?.contentDetails?.relatedPlaylists?.uploads,
          () => {
            log(`Could not find YouTube channel (${channelId})`);
            process.exit();
          }
        )
        .then((playlistId) => {
          if (playlistId) cache.set(cacheKey, playlistId, 86400);
          return playlistId;
        }));

    return playlistId ? await this.getVideosByPlaylistId(playlistId) : [];
  };

  getVideosByPlaylistId = async (playlistId: string) =>
    await this.youtube.playlistItems
      .list({
        part: ['snippet,contentDetails'],
        playlistId: playlistId,
        maxResults: config.maxResults,
      })
      .then(
        (response) =>
          response?.data?.items?.map((item) => ({
            id: item?.snippet?.resourceId?.videoId ?? '',
            title: item?.snippet?.title ?? '',
            description: item?.snippet?.description ?? '',
            date: item?.contentDetails?.videoPublishedAt ?? '',
          })) ?? []
      )
      .catch(() => {
        log(`Could not find YouTube playlist (${playlistId})`);
        process.exit();
      });

  getVideoDetails = async (videoId: string) =>
    await this.youtube.videos
      .list({
        part: ['snippet,contentDetails,status'],
        id: [videoId],
      })
      .then((response): [Video, boolean] => {
        const videoDetails = response.data?.items?.shift();
        return [
          {
            id: videoDetails?.id ?? '',
            title: videoDetails?.snippet?.title ?? '',
            description: videoDetails?.snippet?.description ?? '',
            date: videoDetails?.snippet?.publishedAt ?? '',
            duration: moment.duration(videoDetails?.contentDetails?.duration).asSeconds(),
          },
          videoDetails?.status?.uploadStatus === 'processed',
        ];
      });

  getCoverArtUrlByUsername = async (username: string) =>
    await this.youtube.channels
      .list({ part: ['snippet'], forUsername: username })
      .then((response) => response?.data?.items?.shift()?.snippet?.thumbnails?.high?.url);

  getCoverArtUrlByChannelId = async (channelId: string) =>
    await this.youtube.channels
      .list({ part: ['snippet'], id: [channelId] })
      .then((response) => response?.data?.items?.shift()?.snippet?.thumbnails?.high?.url);
}

export default YouTubeService.getInstance();
