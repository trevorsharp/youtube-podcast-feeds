const config = require('../config');
const { google } = require('googleapis');

const youtube = google.youtube({
  version: 'v3',
  auth: config.apiKey,
});

async function getVideosByUsername(username) {
  const playlistId = await youtube.channels
    .list({ part: 'contentDetails', forUsername: username })
    .then(
      (response) =>
        response.data.items[0].contentDetails.relatedPlaylists.uploads
    );

  return await getVideosByPlaylistId(playlistId);
}

async function getVideosByChannelId(channelId) {
  const playlistId = await youtube.channels
    .list({ part: 'contentDetails', id: channelId })
    .then(
      (response) =>
        response.data.items[0].contentDetails.relatedPlaylists.uploads
    );

  return await getVideosByPlaylistId(playlistId);
}

async function getVideosByPlaylistId(playlistId) {
  const videos = await youtube.playlistItems
    .list({
      part: 'snippet',
      playlistId: playlistId,
      maxResults: config.fetchSize,
    })
    .then((response) =>
      response.data.items
        .map((item) => ({
          id: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          date: item.snippet.publishedAt,
        }))
        .slice(0, config.maxEpisodes)
    );

  return videos;
}

module.exports = {
  getVideosByUsername,
  getVideosByChannelId,
  getVideosByPlaylistId,
};
