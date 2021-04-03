import config from './config';

export default (message: string) =>
  console.log(
    `${new Date().toLocaleDateString('en-US', {
      timeZone: config.timeZone,
    })} ${new Date().toLocaleTimeString('en-US', {
      timeZone: config.timeZone,
    })} - ${message}`
  );
