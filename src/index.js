const feedUpdater = require('./feedUpdater');
const logger = require('./utilities/logger');
const { updateInterval } = require('./config');

const scheduledTask = async () => {
  feedUpdater.run().then((_) => logger.log(`Update Complete`));
};

scheduledTask();
setInterval(scheduledTask, 3600000 * (updateInterval || 2));
