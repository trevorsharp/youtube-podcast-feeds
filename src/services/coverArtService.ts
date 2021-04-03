import fs from 'fs';
import axios from 'axios';
import { Feed } from '../types';
import youtubeService from './youtubeService';
import config from '../utilities/config';

class CoverArtService {
  public static downloadCoverArtAsync = async (feed: Feed) => {
    const file = `${config.getFeedDirectory(feed.id)}/${config.coverArtFileName}`;

    if (!fs.existsSync(file)) {
      const coverArtUrl =
        (feed.user && (await youtubeService.getCoverArtUrlByUsername(feed.user))) ||
        (feed.channel && (await youtubeService.getCoverArtUrlByChannelId(feed.channel))) ||
        undefined;

      if (coverArtUrl) {
        axios
          .get(coverArtUrl, { responseType: 'stream' })
          .then((response) => response.data.pipe(fs.createWriteStream(file)));
      }
    }
  };
}

export default CoverArtService;
