const config = require('../config');

const log = (message) =>
  console.log(
    `${new Date().toLocaleDateString('en-US', {
      timeZone: config.timeZone || 'America/New_York',
    })} ${new Date().toLocaleTimeString('en-US', {
      timeZone: config.timeZone || 'America/New_York',
    })} - ${message}`
  );

module.exports = {
  log,
};