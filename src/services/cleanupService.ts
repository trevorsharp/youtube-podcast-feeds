import fs from 'fs';
import { Feed } from '../types';
import config from '../utilities/config';
import log from '../utilities/log';

class CleanupService {
  static removeOldContent = (feeds: Feed[]) => {
    if (!fs.existsSync(config.contentDirectory)) {
      fs.mkdirSync(config.contentDirectory, { recursive: true });
    }

    const videoFiles = fs.readdirSync(config.contentDirectory);

    videoFiles.forEach((file) => {
      if (
        !feeds.some((feed) =>
          feed.videos.map((video) => video.id).includes(file.replace(config.videoFileExtension, ''))
        )
      ) {
        try {
          fs.unlinkSync(`${config.contentDirectory}/${file}`);
        } catch {
          log(`Failed to remove a file in the content directory - ${file}`);
        }
      }
    });
  };
}

export default CleanupService;
