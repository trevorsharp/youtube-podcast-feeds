const config = require('../../config.json');
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
    );

  return await getVideosByPlaylistId(playlistId);
};

const getVideosByChannelId = async (channelId) => {
  const playlistId = await youtube.channels
    .list({ part: 'contentDetails', id: channelId })
    .then(
      (response) =>
        response.data.items[0].contentDetails.relatedPlaylists.uploads
    );

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
    );

  return videos;
};

module.exports = {
  getVideosByUsername,
  getVideosByChannelId,
  getVideosByPlaylistId,
};
