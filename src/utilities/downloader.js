const fs = require('fs');
const ytdl = require('ytdl-core');
const logger = require('./logger');

const downloadContent = async (videoId, directory) => {
  const file = `${directory}/${videoId}.mp4`;

  const url = `http://www.youtube.com/watch?v=${videoId}`;

  if (!fs.existsSync(file)) {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    logger.log(`Starting Download for ${videoId}`);
    ytdl(url, {
      quality: 'highest',
      filter: (format) => format.container === 'mp4',
    })
      .pipe(fs.createWriteStream(file))
      .on('finish', () => logger.log(`Download Complete for ${videoId}`));
  }
};

module.exports = { downloadContent };
