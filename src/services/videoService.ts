import fs from 'fs';
import { execSync, spawn } from 'child_process';
import { Feed } from '../types';
import log from '../utilities/log';
import config from '../utilities/config';
import cache from '../utilities/cache';

interface StreamUrl {
  url?: string;
  error?: string;
}

class VideoService {
  static getVideoUrlPath = (videoId: string): string | undefined => {
    const videoFilePath = `${config.contentDirectory}/${videoId}${config.videoFileExtension}`;
    const maxVideoFilePath = `${config.contentDirectory}/${videoId}${config.maxVideoFileExtension}`;

    return fs.existsSync(videoFilePath)
      ? config.getVideoUrlPath(videoFilePath)
      : fs.existsSync(maxVideoFilePath)
      ? config.getVideoUrlPath(maxVideoFilePath)
      : undefined;
  };

  static getStreamUrl = (videoId: string): StreamUrl => {
    const cacheKey = `video-url-${videoId}`;
    const cacheResult = cache.get(cacheKey);
    if (cacheResult) {
      return { url: cacheResult as string };
    }

    const youtubeUrl = `http://www.youtube.com/watch?v=${videoId}`;
    try {
      const url = execSync(
        `yt-dlp -g --format=best[vcodec^=avc1] ${
          fs.existsSync(config.cookiesFilePath) ? `--cookies=${config.cookiesFilePath}` : ''
        } ${youtubeUrl}`
      ).toString();

      cache.set(cacheKey, url, 3600);

      return { url };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  static downloadNewContent = (feeds: Feed[], onComplete: (didDownload: boolean) => void) => {
    const downloadList: string[] = [];

    if (!fs.existsSync(config.contentDirectory))
      fs.mkdirSync(config.contentDirectory, { recursive: true });

    feeds.forEach((feed) =>
      feed.videos.forEach((video) => {
        if (
          feed.highQualityVideo &&
          !fs.existsSync(`${config.contentDirectory}/${video.id}${config.videoFileExtension}`) &&
          !fs.existsSync(`${config.contentDirectory}/${video.id}${config.maxVideoFileExtension}`)
        ) {
          downloadList.push(video.id);
        }
      })
    );

    const skipDownloads = !fs.existsSync(config.availableToDownloadFile);

    if (downloadList.length === 0 || skipDownloads) {
      onComplete(!skipDownloads);
      return;
    }

    if (fs.existsSync(config.downloadsFilePath)) fs.unlinkSync(config.downloadsFilePath);

    downloadList.forEach((videoId) => fs.appendFileSync(config.downloadsFilePath, `${videoId}\n`));

    fs.unlinkSync(config.availableToDownloadFile);

    const videoDownloadProcess = spawn('sh', [
      './downloadVideos.sh',
      config.downloadsFilePath,
      config.maxQualityVideo.toString(),
      config.maxVideoHeight.toString(),
      fs.existsSync(config.cookiesFilePath) ? config.cookiesFilePath : '',
    ]);

    videoDownloadProcess.stdout.on('data', (data) => log(data));
    videoDownloadProcess.stderr.on('data', (data) => log(data));
    videoDownloadProcess.on('error', (error) => log(`Download Error: ${error.message}`));
    videoDownloadProcess.on('close', (_) => {
      if (fs.existsSync(config.downloadsFilePath)) fs.unlinkSync(config.downloadsFilePath);
      fs.writeFileSync(config.availableToDownloadFile, '');
      onComplete(true);
    });
  };
}

export default VideoService;
