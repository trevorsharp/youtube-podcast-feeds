interface BaseFeedConfig {
  readonly id: string;
  readonly title: string;
  readonly channel: string | undefined;
  readonly user: string | undefined;
  readonly playlist: string | undefined;
  readonly filter: string | undefined;
  readonly episodeNumbers: string | undefined;
  readonly titleCase: boolean | undefined;
  readonly cleanTitles: string[][] | undefined;
}

export interface RawFeedConfig extends BaseFeedConfig {
  readonly maxEpisodes: number | undefined;
  readonly highQualityVideo: boolean | undefined;
}

export interface FeedConfig extends BaseFeedConfig {
  readonly maxEpisodes: number;
  readonly highQualityVideo: boolean;
}

export interface Feed extends FeedConfig {
  videos: Video[];
}

export interface Video {
  id: string;
  title: string;
  date: string;
  description: string;
  duration?: number;
}
