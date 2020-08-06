const Ajv = require('ajv');
const ajv = new Ajv();
const configSchema = require('./config.schema.json');
try {
  require('../config.json');
} catch (e) {
  console.log('config.json is not found');
  process.exit();
}
const config = require('../config.json');

if (!ajv.validate(configSchema, config)) {
  console.log(
    `The config.json file is not valid: \n\n ${JSON.stringify(
      ajv.errors,
      null,
      4
    )}`
  );
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
