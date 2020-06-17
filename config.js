module.exports = {
  hostname: 'https://yourdomain.com',
  workingDirectory: './data',
  apiKey: 'put-your-youtube-api-key-here',
  fetchSize: 15,
  maxEpisodes: 1,
  refreshInterval: 3,
  feeds: [
    {
      id: 'h3podcast',
      title: 'H3 Podcast',
      channel: 'UCLtREJY21xRfCuEKvdki1Kw',
      regex: 'H3 Podcast #[0-9]+',
    },
  ],
};
