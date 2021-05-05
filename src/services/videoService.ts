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
  static isVideoDownloaded = (videoId: string): boolean =>
    fs.existsSync(config.contentDirectory)
      ? fs.readdirSync(config.contentDirectory).includes(`${videoId}${config.videoFileExtension}`)
      : false;

  static getStreamUrl = (videoId: string, audioOnly: boolean = false): StreamUrl => {
    const cacheKey = `${audioOnly ? 'audio' : 'video'}-url-${videoId}`;
    const cacheResult = cache.get(cacheKey);
    if (cacheResult) {
      return { url: cacheResult as string };
    }

    const youtubeUrl = `http://www.youtube.com/watch?v=${videoId}`;
    try {
      const url = execSync(
        `youtube-dl -g --format=${audioOnly ? 'bestaudio[ext=m4a]' : 'best[ext=mp4]'} ${
          fs.existsSync(config.cookiesFilePath) ? `--cookies=${config.cookiesFilePath}` : ''
        } ${youtubeUrl}`
      ).toString();

      cache.set(cacheKey, url, 3600);

      return { url };
    } catch (error) {
      return { error: error.message };
    }
  };

  static downloadNewContent = (feeds: Feed[], onComplete: () => void) => {
    const downloadList: string[] = [];

    if (!fs.existsSync(config.contentDirectory))
      fs.mkdirSync(config.contentDirectory, { recursive: true });

    feeds.forEach((feed) =>
      feed.videos.forEach((video) => {
        if (
          (feed.highQualityVideo != undefined ? feed.highQualityVideo : config.highQualityVideo) &&
          !fs
            .readdirSync(config.contentDirectory)
            .includes(`${video.id}${config.videoFileExtension}`)
        ) {
          downloadList.push(video.id);
        }
      })
    );

    if (downloadList.length === 0) {
      onComplete();
      return;
    }

    if (fs.existsSync(config.downloadsFilePath)) fs.unlinkSync(config.downloadsFilePath);

    downloadList.forEach((videoId) =>
      fs.appendFileSync(config.downloadsFilePath, `http://www.youtube.com/watch?v=${videoId}\n`)
    );

    const videoDownloadProcess = spawn('youtube-dl', [
      '-i',
      '--format=bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio',
      '--merge-output-format=mp4',
      `--output=${config.contentDirectory}/%(id)s.%(ext)s`,
      `--batch-file=${config.downloadsFilePath}`,
      fs.existsSync(config.cookiesFilePath) ? `--cookies=${config.cookiesFilePath}` : '',
    ]);

    videoDownloadProcess.stdout.on('data', (data) => log(data));
    videoDownloadProcess.stderr.on('data', (data) => log(`Download Error: ${data}`));
    videoDownloadProcess.on('error', (error) => log(`Download Error: ${error.message}`));
    videoDownloadProcess.on('close', (_) => {
      if (fs.existsSync(config.downloadsFilePath)) fs.unlinkSync(config.downloadsFilePath);

      onComplete();
    });
  };
}

export default VideoService;
