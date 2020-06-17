const fs = require('fs');
const ytdl = require('ytdl-core');

function downloadContent(videoId, directory) {
  const file = `${directory}/${videoId}.mp4`;
  try {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory);
    }
    if (!fs.existsSync(file)) {
      var content = ytdl(`http://www.youtube.com/watch?v=${videoId}`, {
        quality: 'highest',
      });
      content.pipe(fs.createWriteStream(file));
      content.on('progress', (_, received, total) => {
        log(
          `Downloading (${videoId}): ${Math.round((received / total) * 100)}%`
        );
      });
    }
  } catch (err) {
    console.error(err);
  }
}

function log(message) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(message);
}

module.exports = { downloadContent };
