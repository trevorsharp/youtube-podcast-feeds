const fs = require('fs');
const { spawn } = require('child_process');
const logger = require('./logger');
const { workingDirectory, contentDirectory } = require('../config');

const downloadNewContent = (feeds, onComplete) => {
  const downloadsFile = `${workingDirectory}/.download.txt`;
  const cookiesFile = `/app/cookies.txt`;
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

  if (videoIdsToDownload.length === 0) {
    onComplete();
    return;
  }

  if (fs.existsSync(downloadsFile)) {
    fs.unlinkSync(downloadsFile);
  }

  videoIdsToDownload.map((videoId) =>
    fs.appendFileSync(
      downloadsFile,
      `http://www.youtube.com/watch?v=${videoId}\n`
    )
  );

  const cookiesFileExists = fs.existsSync(cookiesFile);

  const downloadProcess = spawn('youtube-dl', [
    '--format=bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio',
    '--merge-output-format=mp4',
    `--output=${contentDirectory}/%(id)s.%(ext)s`,
    `--batch-file=${downloadsFile}`,
    cookiesFileExists ? `--cookies=${cookiesFile}` : '',
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
};

module.exports = { downloadNewContent };
