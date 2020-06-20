const fs = require('fs');
const { spawn } = require('child_process');
const logger = require('./logger');

const downloadNewContent = (
  feeds,
  workingDirectory,
  contentDirectory,
  onComplete
) => {
  const downloadsFile = `${workingDirectory}/.download.txt`;
  const videoIdsToDownload = [];

  if (!fs.existsSync(contentDirectory)) {
    fs.mkdirSync(contentDirectory, { recursive: true });
  }

  const videoFiles = fs.readdirSync(contentDirectory);

  feeds.map((feed) => {
    feed.videos.map(
      (video) =>
        !videoFiles.includes(`${video.id}.mp4`) &&
        videoIdsToDownload.push(video.id)
    );
  });

  if (videoIdsToDownload.length > 0) {
    if (fs.existsSync(downloadsFile)) {
      fs.unlinkSync(downloadsFile);
    }

    videoIdsToDownload.map((videoId) =>
      fs.appendFileSync(
        downloadsFile,
        `http://www.youtube.com/watch?v=${videoId}\n`
      )
    );

    const downloadProcess = spawn('youtube-dl', [
      '--format=bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio',
      '--merge-output-format=mp4',
      `--output=${contentDirectory}/%(id)s.%(ext)s`,
      `--batch-file=${downloadsFile}`,
    ]);

    downloadProcess.stdout.on('data', (data) => logger.log(data));

    downloadProcess.stderr.on('data', (data) =>
      logger.log(`Download Error: ${data}`)
    );

    downloadProcess.on('error', (error) =>
      logger.log(`Download Error: ${error.message}`)
    );

    downloadProcess.on('close', (_) => {
      if (fs.existsSync(downloadsFile)) {
        fs.unlinkSync(downloadsFile);
      }
      onComplete();
    });
  }
};

module.exports = { downloadNewContent };
