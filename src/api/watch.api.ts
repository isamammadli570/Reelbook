/** One video TMDB lists for a title; only YouTube ones can be opened. */
export type Video = {
    key: string;
    name: string;
    site: string;
    type: string;
    official: boolean;
    iso_639_1: string | null;
    published_at: string;
};

export type Provider = {
    provider_id: number;
    provider_name: string;
    logo_path: string | null;
    display_priority: number;
};

/** Where a title is offered in one country, from JustWatch via TMDB. `link` is TMDB's watch page for it. */
export type RegionProviders = {
    link: string;
    flatrate?: Provider[];
    free?: Provider[];
    ads?: Provider[];
    rent?: Provider[];
    buy?: Provider[];
};

/** Appended to a movie or series request as `videos,watch/providers`. */
export type WatchExtras = {
    videos: {results: Video[]};
    "watch/providers": {results: Record<string, RegionProviders>};
};

export const WATCH_APPEND = "videos,watch/providers";

/** Videos are filtered to the request language unless asked otherwise; English and untagged ones are the fallback. */
export const VIDEO_LANGUAGES = "en,ru,null";
