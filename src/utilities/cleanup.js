const fs = require('fs');

const removeOldContent = (feeds, contentDirectory) => {
  if (!fs.existsSync(contentDirectory)) {
    fs.mkdirSync(contentDirectory, { recursive: true });
  }

  const videoFiles = fs.readdirSync(contentDirectory);

  videoFiles.map(
    (file) =>
      !feeds.some((feed) =>
        feed.videos.map((video) => video.id).includes(file.replace('.mp4', ''))
      ) && fs.unlinkSync(`${contentDirectory}/${file}`)
  );
};

module.exports = { removeOldContent };
