const config = require('./config.json');
const orchestrator = require('./utilities/orchestrator');

orchestrator.updateFeeds();
setInterval(orchestrator.updateFeeds, 3600000 * config.refreshInterval);
