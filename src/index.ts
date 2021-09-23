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

app.get('/video/:videoId', async (req, res) => {
  if (videoService.isVideoDownloaded(req.params.videoId)) {
    return res.redirect(302, `/content/${req.params.videoId}${config.videoFileExtension}`);
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
    if (rss === '') {
      res.redirect('/');
      return;
    }
    res.setHeader('content-type', 'application/rss+xml');
    res.send(rss);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/', (_, res) => {
  try {
    const feedLinks = config.feedConfigs
      .map((feedConfig) => {
        var title = feedConfig.title;
        const url = `${config.hostname}/${feedConfig.id}`;
        return `<strong>${title}</strong> &mdash; <a href="${url}">${url}</a>`;
      })
      .reduce(
        (accumulator, value) => `${accumulator}<p>${value}</p>`,
        '<html><body style="font-family: sans-serif; padding: 50px;"><h2>Podcast Feeds</h2>'
      )
      .concat(`</ul></body></html>`);

    res.send(feedLinks);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('*', (_, res) => res.redirect('/'));

app.listen(port, () => {
  log(`Listening on port ${port}`);
});

const scheduledTask = async () => {
  feedService.updateFeeds();
};

scheduledTask();
setInterval(scheduledTask, config.updateInterval * 3600000);
