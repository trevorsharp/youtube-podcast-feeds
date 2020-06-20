const config = require('./config.js');
const feedUpdater = require('./feedUpdater');
const logger = require('./utilities/logger');

const scheduledTask = async () => {
  feedUpdater.run().then((_) => logger.log(`Update Complete`));
};

scheduledTask();
setInterval(scheduledTask, 3600000 * (config.updateInterval || 2));
