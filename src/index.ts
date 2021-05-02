import express from 'express';
import feedService from './services/feedService';
import rssService from './services/rssService';
import videoService from './services/videoService';
import config from './utilities/config';
import log from './utilities/log';

const app = express();
const port = process.env.NODE_ENV === 'development' ? 3000 : 80;

app.use('/content', express.static(`${config.contentDirectory}/`));
app.use('/content/covers', express.static(`${config.workingDirectory}/`));

app.get('/audio/:videoId', async (req, res) => {
  const result = videoService.getStreamUrl(req.params.videoId, true);

  if (result.error || !result.url) {
    return res.status(500).send(`Error: ${result.error}`);
  }

  res.redirect(302, result.url);
});

app.get('/video/:videoId', async (req, res) => {
  if (videoService.isVideoDownloaded(req.params.videoId)) {
    return res.redirect(302, `/content/${req.params.videoId}${config.contentFileExtension}`);
  }

  const result = videoService.getStreamUrl(req.params.videoId);

  if (result.error || !result.url) {
    return res.status(500).send(`Error: ${result.error}`);
  }

  res.redirect(302, result.url);
});

app.get('/:id', (req, res) => {
  try {
    const rss = rssService.getRssFeed(req.params.id);
    res.setHeader('content-type', 'application/rss+xml');
    res.send(rss);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(port, () => {
  log(`Listening on port ${port}`);
});

const scheduledTask = async () => {
  feedService.updateFeeds();
};

scheduledTask();
setInterval(scheduledTask, config.updateInterval * 3600000);
