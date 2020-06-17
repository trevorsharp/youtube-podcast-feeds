const config = require('../config.json');
const fs = require('fs');

function removeOldContent(feeds) {
  feeds.map((feed) => {
    const directory = `${config.workingDirectory}/${feed.id}/content`;

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
  });
}

module.exports = {
  removeOldContent,
};
