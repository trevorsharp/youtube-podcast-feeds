import fs from 'fs';
import { execSync, spawn } from 'child_process';
import { Feed } from '../types';
import log from '../utilities/log';
import config from '../utilities/config';
import cache from '../utilities/cache';

interface StreamingUrl {
  videoUrl?: string;
  error?: string;
}

class VideoService {
  static getStreamingUrl = (videoId: string): StreamingUrl => {
    const cacheResult = cache.get(`video-url-${videoId}`);
    if (cacheResult) {
      return { videoUrl: cacheResult as string };
    }

    const youtubeUrl = `http://www.youtube.com/watch?v=${videoId}`;
    try {
      const videoUrl = execSync(
        `youtube-dl -g --format=best[ext=mp4] ${
          fs.existsSync(config.cookiesFilePath) ? `--cookies=${config.cookiesFilePath}` : ''
        } ${youtubeUrl}`
      ).toString();

      cache.set(`video-url-${videoId}`, videoUrl, 3600);

      return { videoUrl };
    } catch (error) {
      return { error: error.message };
    }
  };

  static downloadNewContent = (feeds: Feed[], onComplete: () => void) => {
    const videoIdsToDownload: string[] = [];

    if (!fs.existsSync(config.contentDirectory))
      fs.mkdirSync(config.contentDirectory, { recursive: true });

    feeds
      .filter((feed) => feed.download)
      .map((feed) => {
        feed.videos.map(
          (video) =>
            !fs
              .readdirSync(config.contentDirectory)
              .includes(`${video.id}${config.contentFileExtension}`) &&
            videoIdsToDownload.push(video.id)
        );
      });

    if (videoIdsToDownload.length === 0) {
      onComplete();
      return;
    }

    if (fs.existsSync(config.downloadsFilePath)) fs.unlinkSync(config.downloadsFilePath);

    videoIdsToDownload.map((videoId) =>
      fs.appendFileSync(config.downloadsFilePath, `http://www.youtube.com/watch?v=${videoId}\n`)
    );

    const downloadProcess = spawn('youtube-dl', [
      '--format=bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio',
      '--merge-output-format=mp4',
      `--output=${config.contentDirectory}/%(id)s.%(ext)s`,
      `--batch-file=${config.downloadsFilePath}`,
      fs.existsSync(config.cookiesFilePath) ? `--cookies=${config.cookiesFilePath}` : '',
    ]);

    downloadProcess.stdout.on('data', (data) => log(data));
    downloadProcess.stderr.on('data', (data) => log(`Download Error: ${data}`));
    downloadProcess.on('error', (error) => log(`Download Error: ${error.message}`));
    downloadProcess.on('close', (_) => {
      if (fs.existsSync(config.downloadsFilePath)) fs.unlinkSync(config.downloadsFilePath);

      onComplete();
    });
  };
}

export default VideoService;
