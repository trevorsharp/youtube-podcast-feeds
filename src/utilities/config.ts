import config from 'config';
import { FeedConfig, RawFeedConfig } from '../types';

class Config {
  private static instance: Config;
  readonly workingDirectory: string;
  readonly contentDirectory: string;
  readonly feedDataFileName: string;
  readonly coverArtFileName: string;
  readonly downloadsFilePath: string;
  readonly availableToDownloadFile: string;
  readonly remuxerScriptPath: string;
  readonly cookiesFilePath: string;
  readonly videoFileExtension: string;
  readonly hostname: string;
  readonly apiKey: string;
  readonly timeZone: string;
  readonly updateInterval: number;
  readonly maxResults: number;
  readonly maxEpisodes: number;
  readonly highQualityVideo: boolean;
  readonly maxQualityVideo: boolean;
  readonly feedConfigs: FeedConfig[];

  private constructor() {
    this.workingDirectory = './data';
    this.contentDirectory = `${this.workingDirectory}/content`;
    this.feedDataFileName = 'feedData.json';
    this.coverArtFileName = 'cover.png';
    this.downloadsFilePath = `${this.workingDirectory}/.download.txt`;
    this.cookiesFilePath = './cookies.txt';
    this.videoFileExtension = '.mp4';
    this.availableToDownloadFile = `./availableToDownload`;
    this.remuxerScriptPath = `./remuxer.sh`;

    this.timeZone = config.get('timeZone');
    this.updateInterval = config.get('updateInterval');
    this.maxResults = Math.floor(config.get('maxResults'));
    this.maxEpisodes = Math.floor(config.get('maxEpisodes'));
    this.highQualityVideo = config.get('highQualityVideo');
    this.maxQualityVideo = config.get('highQualityVideo');

    this.hostname = config.has('hostname')
      ? config.get('hostname')
      : this.validationError('Hostname', 'Missing');
    this.apiKey = config.has('apiKey')
      ? config.get('apiKey')
      : this.validationError('API Key', 'Missing');

    this.feedConfigs = config.has('feeds')
      ? config.get<RawFeedConfig[]>('feeds').map((feed) => ({
          ...feed,
          maxEpisodes: feed.maxEpisodes !== undefined ? feed.maxEpisodes : this.maxEpisodes,
          highQualityVideo:
            feed.highQualityVideo !== undefined ? feed.highQualityVideo : this.highQualityVideo,
        }))
      : this.validationError('Feeds', 'Missing');

    this.validate();
  }

  public static getInstance(): Config {
    if (!Config.instance) Config.instance = new Config();
    return Config.instance;
  }

  public getFeedDirectory = (feedId: string): string => `${this.workingDirectory}/${feedId}`;

  private validate = () => {
    if (!this.hostname.match(/^https?:\/\/[^\s$.?#].[^\s\/]*$/))
      this.validationError('Hostname', this.hostname);

    if (!this.apiKey.match(/^[a-z0-9_\-]+$/i) || this.apiKey.length < 30)
      this.validationError('API Key', this.apiKey);

    if (!this.timeZone.match(/^[a-z]+\/([a-z]|_)+$/i))
      this.validationError('Time Zone', this.timeZone);

    if (isNaN(this.updateInterval) || this.updateInterval <= 0)
      this.validationError('Update Interval', this.updateInterval.toString());

    if (isNaN(this.maxResults) || this.maxResults <= 0)
      this.validationError('Max Results', this.maxResults.toString());

    if (isNaN(this.maxEpisodes) || this.maxEpisodes < 0)
      this.validationError('Max Episodes', this.maxEpisodes.toString());

    if (!this.feedConfigs || this.feedConfigs.length < 1)
      this.validationError('Feeds Config', 'Requires At Least One Feed');

    const feedConfigIds = this.feedConfigs.map((item) => item.id);
    if (feedConfigIds.some((item, index) => feedConfigIds.indexOf(item) != index))
      this.validationError('Feeds Config', 'Id Values Must Be Unique');

    this.feedConfigs.forEach((feedConfig) => {
      if (
        !feedConfig.id.match(/^[-a-z0-9]+$/i) ||
        feedConfig.id === 'content' ||
        feedConfig.id === 'video' ||
        feedConfig.id.length < 1
      )
        this.validationError('Feed Id', feedConfig.id);

      if (feedConfig.title.length < 1) this.validationError('Feed Title', feedConfig.title);

      if (feedConfig.filter && !this.isValidRegexString(feedConfig.filter))
        this.validationError('Feed Filter', feedConfig.filter);

      if (feedConfig.episodeNumbers && !this.isValidRegexString(feedConfig.episodeNumbers))
        this.validationError('Feed Episode Numbers', feedConfig.episodeNumbers);

      if (!feedConfig.channel && !feedConfig.user && !feedConfig.playlist)
        this.validationError('Feed', 'Missing Channel, User, or Playlist');

      if (feedConfig.channel && feedConfig.channel.length < 1)
        this.validationError('Feed Channel', feedConfig.channel);

      if (feedConfig.user && feedConfig.user.length < 1)
        this.validationError('Feed User', feedConfig.user);

      if (feedConfig.playlist && feedConfig.playlist.length < 1)
        this.validationError('Feed Playlist', feedConfig.playlist);

      if (
        feedConfig.maxEpisodes === undefined ||
        isNaN(feedConfig.maxEpisodes) ||
        feedConfig.maxEpisodes < 0
      )
        this.validationError('Feed Max Episodes', feedConfig.maxEpisodes.toString());

      if (feedConfig.cleanTitles)
        feedConfig.cleanTitles.forEach((cleanTitleItem) => {
          if (cleanTitleItem.length != 2)
            this.validationError('Feed Clean Titles', JSON.stringify(cleanTitleItem));

          if (!this.isValidRegexString(cleanTitleItem[0]))
            this.validationError('Feed Clean Titles', JSON.stringify(cleanTitleItem));
        });
    });
  };

  private validationError = (propertyName: string, value: string) => {
    console.log(`Invalid ${propertyName} (${value}) - Please Check Your Config File`);
    process.exit();
  };

  private isValidRegexString = (regex: string): boolean => {
    try {
      new RegExp(regex);
      return true;
    } catch (e) {
      return false;
    }
  };
}

export default Config.getInstance();
