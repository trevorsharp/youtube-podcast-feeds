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

  static getStreamUrl = (videoId: string, audioOnly: boolean = false) => {
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
    const downloadList: { videoId: string; audioOnly: boolean }[] = [];

    if (!fs.existsSync(config.contentDirectory))
      fs.mkdirSync(config.contentDirectory, { recursive: true });

    feeds.forEach((feed) =>
      feed.videos.forEach((video) => {
        if (
          config.isHighQualityVideo(feed.id) &&
          !fs
            .readdirSync(config.contentDirectory)
            .includes(`${video.id}${config.videoFileExtension}`)
        ) {
          downloadList.push({ videoId: video.id, audioOnly: false });
        }

        if (
          config.isAudioOnly(feed.id) &&
          !fs
            .readdirSync(config.contentDirectory)
            .includes(`${video.id}${config.audioFileExtension}`)
        ) {
          downloadList.push({ videoId: video.id, audioOnly: true });
        }
      })
    );

    if (downloadList.length === 0) {
      onComplete();
      return;
    }

    if (fs.existsSync(config.downloadsFilePath)) fs.unlinkSync(config.downloadsFilePath);

    downloadList
      .filter((item) => item.audioOnly === true)
      .map((downloadItem) => downloadItem.videoId)
      .forEach((videoId) =>
        fs.appendFileSync(config.downloadsFilePath, `http://www.youtube.com/watch?v=${videoId}\n`)
      );

    const audioDownloadProcess = spawn('youtube-dl', [
      '--format=bestaudio[ext=m4a]',
      '--extract-audio',
      '--audio-format=mp3',
      '--prefer-ffmpeg',
      `--output=${config.contentDirectory}/%(id)s.%(ext)s`,
      `--batch-file=${config.downloadsFilePath}`,
      fs.existsSync(config.cookiesFilePath) ? `--cookies=${config.cookiesFilePath}` : '',
    ]);

    audioDownloadProcess.stdout.on('data', (data) => log(data));
    audioDownloadProcess.stderr.on('data', (data) => log(`Download Error: ${data}`));
    audioDownloadProcess.on('error', (error) => log(`Download Error: ${error.message}`));
    audioDownloadProcess.on('close', (_) => {
      if (fs.existsSync(config.downloadsFilePath)) fs.unlinkSync(config.downloadsFilePath);

      downloadList
        .filter((item) => item.audioOnly === false)
        .map((downloadItem) => downloadItem.videoId)
        .forEach((videoId) =>
          fs.appendFileSync(config.downloadsFilePath, `http://www.youtube.com/watch?v=${videoId}\n`)
        );

      const videoDownloadProcess = spawn('youtube-dl', [
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
    });
  };
}

export default VideoService;
