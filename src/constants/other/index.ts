export const MEDIA_TYPE = {
    MOVIE: "movie",
    TV: "tv",
} as const;
export type MediaType = (typeof MEDIA_TYPE)[keyof typeof MEDIA_TYPE];

export const MEDIA_FILTER = {
    ALL: "all",
    ...MEDIA_TYPE,
} as const;
export type MediaFilter = (typeof MEDIA_FILTER)[keyof typeof MEDIA_FILTER];

export const TIME_WINDOW = {
    DAY: "day",
    WEEK: "week",
} as const;
export type TimeWindow = (typeof TIME_WINDOW)[keyof typeof TIME_WINDOW];

export const IMAGE_SIZE = {
    POSTER: "w342",
    BACKDROP: "w780",
    PROFILE: "w185",
} as const;
export type ImageSize = (typeof IMAGE_SIZE)[keyof typeof IMAGE_SIZE];

/** TMDB has almost no Azerbaijani translations and falls back to the original title, so AZ asks for English. */
export const TMDB_LANGUAGE: Record<string, string> = {
    az: "en-US",
    en: "en-US",
    ru: "ru-RU",
};

export const QUERY_KEYS = {
    TRENDING: "trending",
    MOVIE: "movie",
    SERIES: "series",
    SEASON: "season",
    LIBRARY: "library",
    PROFILE: "profile",
} as const;

/** Bump the suffix when a stored shape changes in a way old data cannot be read as. */
export const STORAGE_KEYS = {
    LIBRARY: "library:v1",
    PROFILE: "profile:v1",
    LANGUAGE: "settings:language",
} as const;

export const PROFILE_LIMITS = {
    NAME_MAX: 40,
    BIO_MAX: 160,
} as const;

/** TMDB's English series status mapped to an i18n key under `details:status`. */
export const SERIES_STATUS_KEY: Record<string, string> = {
    "Returning Series": "returning",
    "Ended": "ended",
    "Canceled": "canceled",
    "In Production": "inProduction",
    "Planned": "planned",
    "Pilot": "pilot",
};

export const CAST_LIMIT = 12;
export const RECOMMENDATION_LIMIT = 8;

export const POSTER_COLUMNS = 4;
/** Web shows the app as a phone-width column instead of stretching posters across a desktop screen. */
export const MAX_CONTENT_WIDTH = 520;
