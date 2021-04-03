import feedUpdater from './services/feedUpdateService';
import config from './utilities/config';

const scheduledTask = async () => {
  feedUpdater.updateFeeds();
};

scheduledTask();
setInterval(scheduledTask, config.updateInterval * 3600000);
