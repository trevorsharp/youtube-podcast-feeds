const { google } = require('googleapis');
const moment = require('moment');
const momentDurationFormatSetup = require('moment-duration-format');
const { apiKey, maxResults } = require('../config');
const logger = require('./logger');

momentDurationFormatSetup(moment);

const youtube = google.youtube({
  version: 'v3',
  auth: apiKey,
});

const getVideosByUsername = async (username) => {
  const playlistId = await youtube.channels
    .list({ part: 'contentDetails', forUsername: username })
    .then(
      (response) =>
        response.data.items[0].contentDetails.relatedPlaylists.uploads
    )
    .catch(() => {
      logger.log(`Could not find YouTube username: ${username}`);
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
      logger.log(`Could not find YouTube channel for id: ${channelId}`);
      process.exit();
    });

  return await getVideosByPlaylistId(playlistId);
};

const getVideosByPlaylistId = async (playlistId) => {
  const videos = await youtube.playlistItems
    .list({
      part: 'snippet',
      playlistId: playlistId,
      maxResults: maxResults || 5,
    })
    .then((response) =>
      Promise.all(
        response.data?.items
          ?.map((item) => {
            return youtube.videos
              .list({
                part: ['snippet,contentDetails'],
                id: [item.snippet.resourceId.videoId],
              })
              .then((response) => {
                const videoDetails = response.data?.items[0];
                return {
                  id: item.snippet.resourceId.videoId,
                  title: item.snippet.title,
                  description: item.snippet.description,
                  date: videoDetails?.snippet?.publishedAt,
                  duration: moment
                    .duration(videoDetails?.contentDetails?.duration)
                    .asSeconds(),
                  isLive: videoDetails?.snippet?.liveBroadcastContent != 'none',
                };
              });
          })
          .filter((item) => !item.isLive)
      )
    )
    .catch(() => {
      logger.log(`Could not find YouTube playlist for id: ${playlistId}`);
      process.exit();
    });

  return videos;
};

const getCoverArtUrlByUsername = async (username) =>
  await youtube.channels
    .list({ part: 'snippet', forUsername: username })
    .then((response) => response.data.items[0].snippet.thumbnails.high?.url);

const getCoverArtUrlByChannelId = async (channelId) =>
  await youtube.channels
    .list({ part: 'snippet', id: channelId })
    .then((response) => response.data.items[0].snippet.thumbnails.high?.url);

module.exports = {
  getVideosByUsername,
  getVideosByChannelId,
  getVideosByPlaylistId,
  getCoverArtUrlByUsername,
  getCoverArtUrlByChannelId,
};
