import fs from 'fs';
import { Feed } from '../types';
import config from '../utilities/config';

class CleanupService {
  static removeOldContent = (feeds: Feed[]) => {
    if (!fs.existsSync(config.contentDirectory)) {
      fs.mkdirSync(config.contentDirectory, { recursive: true });
    }

    const videoFiles = fs.readdirSync(config.contentDirectory);

    videoFiles.map(
      (file) =>
        !feeds.some((feed) =>
          feed.videos
            .map((video) => video.id)
            .includes(
              file.replace(config.videoFileExtension, '').replace(config.audioFileExtension, '')
            )
        ) && fs.unlinkSync(`${config.contentDirectory}/${file}`)
    );
  };
}

export default CleanupService;
