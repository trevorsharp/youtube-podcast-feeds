const fs = require('fs');

const removeOldContent = (feed, directory) => {
  if (fs.existsSync(directory)) {
    fs.readdir(directory, (_, files) =>
      files.map((file) => {
        if (
          !feed.videos
            .map((video) => video.id)
            .includes(`${file}`.replace('.mp4', ''))
        ) {
          fs.unlinkSync(`${directory}/${file}`);
        }
      })
    );
  }
};

module.exports = {
  removeOldContent,
};
