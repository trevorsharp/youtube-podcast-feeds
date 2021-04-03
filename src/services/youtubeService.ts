import { google, youtube_v3 } from 'googleapis';
import * as moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
import { Video } from '../types';
import config from '../utilities/config';
import log from '../utilities/log';

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
    const playlistId = await this.youtube.channels
      .list({ part: ['contentDetails'], forUsername: username })
      .then(
        (response) => response?.data?.items?.shift()?.contentDetails?.relatedPlaylists?.uploads,
        () => {
          log(`Could not find YouTube username (${username})`);
          process.exit();
        }
      );

    return playlistId ? await this.getVideosByPlaylistId(playlistId) : [];
  };

  getVideosByChannelId = async (channelId: string) => {
    const playlistId = await this.youtube.channels
      .list({ part: ['contentDetails'], id: [channelId] })
      .then(
        (response) => response?.data?.items?.shift()?.contentDetails?.relatedPlaylists?.uploads,
        () => {
          log(`Could not find YouTube channel (${channelId})`);
          process.exit();
        }
      );

    return playlistId ? await this.getVideosByPlaylistId(playlistId) : [];
  };

  getVideosByPlaylistId = async (playlistId: string) => {
    const videos = await this.youtube.playlistItems
      .list({
        part: ['snippet'],
        playlistId: playlistId,
        maxResults: config.maxResults,
      })
      .then((response) =>
        Promise.all(
          response?.data?.items?.map((item) =>
            this.youtube.videos
              .list({
                part: ['snippet,contentDetails,status'],
                id: [item?.snippet?.resourceId?.videoId ?? ''],
              })
              .then((response): [Video, boolean] => {
                const videoDetails = response.data?.items?.shift();
                return [
                  {
                    id: item?.snippet?.resourceId?.videoId ?? '',
                    title: item?.snippet?.title ?? '',
                    description: item?.snippet?.description ?? '',
                    date: videoDetails?.snippet?.publishedAt ?? '',
                    duration: moment.duration(videoDetails?.contentDetails?.duration).asSeconds(),
                  },
                  videoDetails?.status?.uploadStatus === 'processed',
                ];
              })
          ) ?? []
        )
      )
      .then((result) => result.filter((item) => item[1]).map((item) => item[0]))
      .catch(() => {
        log(`Could not find YouTube playlist (${playlistId})`);
        process.exit();
      });

    return videos;
  };

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
