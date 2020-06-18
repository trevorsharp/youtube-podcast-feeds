const config = require('./config.js');
const feedUpdater = require('./feedUpdater');

const scheduledTask = async () => {
  feedUpdater
    .run()
    .then(console.log(`${new Date().toISOString()} - Update Complete`));
};

scheduledTask();
setInterval(scheduledTask, 3600000 * config.updateInterval);
