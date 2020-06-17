const orchestrator = require('./utilities/orchestrator');

orchestrator.updateFeeds();
setInterval(orchestrator.updateFeeds, 1000 * 60 * 60);
