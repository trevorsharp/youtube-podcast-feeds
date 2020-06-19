const fs = require('fs');
const ytdl = require('ytdl-core');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const logger = require('./logger');

ffmpeg.setFfmpegPath(ffmpegPath);

const downloadContent = async (videoId, directory) => {
  const file = `${directory}/${videoId}.mp4`;
  const videoOnlyFile = `${directory}/video-${videoId}.mp4`;

  const url = `http://www.youtube.com/watch?v=${videoId}`;

  if (!fs.existsSync(file)) {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    logger.log(`Starting Download for ${videoId}`);
    ytdl(url, {
      quality: 'highestaudio',
      filter: (format) => format.container === 'mp4',
    })
      .pipe(fs.createWriteStream(file))
      .on('finish', () => {
        logger.log(`Audio Downloaded for ${videoId}`);
        const video = ytdl(url, {
          quality: 'highestvideo',
          filter: (format) => format.container === 'mp4',
        });
        ffmpeg()
          .input(video)
          .videoCodec('copy')
          .input(file)
          .audioCodec('copy')
          .save(videoOnlyFile)
          .on('error', console.error)
          .on('end', () => {
            logger.log(`Video Downloaded for ${videoId}`);
            fs.unlinkSync(file);
            fs.renameSync(videoOnlyFile, file);
          });
      });
  }
};

module.exports = { downloadContent };
