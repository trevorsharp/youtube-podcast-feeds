const feedUpdater = require('./feedUpdater');
const { updateInterval } = require('./config');

const scheduledTask = async () => {
  feedUpdater.run();
};

scheduledTask();
setInterval(scheduledTask, 3600000 * (updateInterval || 2));
