const readline = require('readline');
const fs = require('fs');
const ytdl = require('ytdl-core');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

function downloadContent(videoId, directory) {
  const file = `${directory}/${videoId}.mp4`;
  const videoOnlyFile = `${directory}/video-${videoId}.mp4`;

  const url = `http://www.youtube.com/watch?v=${videoId}`;

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
  if (!fs.existsSync(file)) {
    ytdl(url, { quality: 'highestaudio' })
      .on('progress', onProgress)
      .pipe(fs.createWriteStream(file))
      .on('finish', () => {
        const video = ytdl(url, { quality: 'highestvideo' });
        video.on('progress', onProgress);
        ffmpeg()
          .input(video)
          .videoCodec('copy')
          .input(file)
          .audioCodec('copy')
          .save(videoOnlyFile)
          .on('error', console.error)
          .on('end', () => {
            fs.unlinkSync(file);
            fs.renameSync(videoOnlyFile, file);
          });
      });
  }
}

const onProgress = (_, downloaded, total) => {
  readline.cursorTo(process.stdout, 0);
  process.stdout.write(
    `Download Progress - ${(downloaded / 1073741824).toFixed(2)} of ${(
      total / 1073741824
    ).toFixed(2)} GB (${((downloaded / total) * 100).toFixed(2)}%)`
  );
};

module.exports = { downloadContent };
