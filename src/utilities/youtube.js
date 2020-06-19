const config = require('../config.js');
const { google } = require('googleapis');

const youtube = google.youtube({
  version: 'v3',
  auth: config.apiKey,
});

const getVideosByUsername = async (username) => {
  const playlistId = await youtube.channels
    .list({ part: 'contentDetails', forUsername: username })
    .then(
      (response) =>
        response.data.items[0].contentDetails.relatedPlaylists.uploads
    )
    .catch(() => {
      console.log(`Could not find YouTube username: ${username}`);
      process.exit();
    });

  return await getVideosByPlaylistId(playlistId);
};

const getVideosByChannelId = async (channelId) => {
  const playlistId = await youtube.channels
    .list({ part: 'contentDetails', id: channelId })
    .then(
      (response) =>
        response.data.items[0].contentDetails.relatedPlaylists.uploads
    )
    .catch(() => {
      console.log(`Could not find YouTube channel for id: ${channelId}`);
      process.exit();
    });

  return await getVideosByPlaylistId(playlistId);
};

const getVideosByPlaylistId = async (playlistId) => {
  const videos = await youtube.playlistItems
    .list({
      part: 'snippet',
      playlistId: playlistId,
      maxResults: 10,
    })
    .then((response) =>
      response.data.items.map((item) => ({
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        date: item.snippet.publishedAt,
      }))
    )
    .catch(() => {
      console.log(`Could not find YouTube playlist for id: ${playlistId}`);
      process.exit();
    });

  return videos;
};

const getCoverArtUrlByUsername = async (username) =>
  await youtube.channels
    .list({ part: 'snippet', forUsername: username })
    .then((response) => response.data.items[0].snippet.thumbnails.high);

const getCoverArtUrlByChannelId = async (channelId) =>
  await youtube.channels
    .list({ part: 'snippet', id: channelId })
    .then((response) => response.data.items[0].snippet.thumbnails.high);

module.exports = {
  getVideosByUsername,
  getVideosByChannelId,
  getVideosByPlaylistId,
  getCoverArtUrlByUsername,
  getCoverArtUrlByChannelId,
};
