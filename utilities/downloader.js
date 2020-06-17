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
    }
  } catch (err) {
    console.error(err);
  }
}

module.exports = { downloadContent };
