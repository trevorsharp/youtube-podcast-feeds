import fs from 'fs';
import { spawn } from 'child_process';
import { Feed } from '../types';
import log from '../utilities/log';
import config from '../utilities/config';

class DownloadService {
  static downloadNewContent = (feeds: Feed[], onComplete: () => void) => {
    if (!fs.existsSync(config.contentDirectory))
      fs.mkdirSync(config.contentDirectory, { recursive: true });

    const videoIdsToDownload: string[] = [];

    feeds.map((feed) => {
      feed.videos.map(
        (video) =>
          !fs.readdirSync(config.contentDirectory).includes(`${video.id}${config.contentFileExtension}`) &&
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

export default DownloadService;