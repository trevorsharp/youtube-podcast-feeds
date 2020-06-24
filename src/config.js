var Ajv = require('ajv');
var ajv = new Ajv();
try {
  require('../config.json');
} catch (e) {
  console.log(`config.json is not found`);
  process.exit();
}

const configSchema = require('./config.schema.json');
const config = require('../config.json');

if (!ajv.validate(configSchema, config)) {
  console.log(`config.json is not valid: ${ajv.errors}`);
  process.exit();
}

const workingDirectory = './data';

const contentDirectory = `${workingDirectory}/content`;

const getFeedDirectory = (feedId) => `${workingDirectory}/${feedId}`;

module.exports = {
  ...config,
  feedConfigs: config.feeds,
  workingDirectory,
  contentDirectory,
  getFeedDirectory,
};
