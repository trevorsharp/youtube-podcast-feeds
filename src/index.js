const config = require('../config.json');
const orchestrator = require('./utilities/orchestrator');

orchestrator.runUpdate();
setInterval(orchestrator.runUpdate, 3600000 * config.refreshInterval);
