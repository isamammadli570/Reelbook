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
    /** Posters drawn small (rows, stacks, list thumbnails): a third of the bytes, still sharp at 3×. */
    THUMB: "w185",
    BACKDROP: "w780",
    PROFILE: "w185",
    LOGO: "w92",
    LOGO_LARGE: "w500",
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
    SEARCH: "search",
    NEW_RELEASES: "newReleases",
    GENRE: "genre",
    DISCOVER: "discover",
    STREAMING_SERVICES: "streamingServices",
    UPCOMING: "upcoming",
    AIRING_TODAY: "airingToday",
    TOP_RATED: "topRated",
    COLLECTION: "collection",
    LISTS: "lists",
    PERSON: "person",
    EPISODE_REMINDERS: "episodeReminders",
    /** Everything about other people; one prefix, so following someone can refresh it all at once. */
    SOCIAL: "social",
} as const;

export const LIST_LIMITS = {
    NAME_MAX: 60,
    DESCRIPTION_MAX: 300,
} as const;

export const SEARCH_DEBOUNCE_MS = 350;

/** Bump the suffix when a stored shape changes in a way old data cannot be read as. */
export const STORAGE_KEYS = {
    LIBRARY: "library:v1",
    PROFILE: "profile:v1",
    LISTS: "lists:v1",
    LANGUAGE: "settings:language",
    EPISODE_REMINDERS: "settings:episodeReminders",
    PREFERENCES: "settings:preferences",
    RECENT_SEARCHES: "search:recent",
    /** Followed by a user id: their whole library has been published as activity once. */
    ACTIVITY_PUBLISHED: "activity:published:",
} as const;

export const REVIEW_MAX_LENGTH = 1000;

/** Avatar backgrounds with the ink that reads on each; chosen on the edit-profile page. */
export const AVATAR_COLORS = {
    amber: {bg: "#F5A524", ink: "#1A1206"},
    teal: {bg: "#5DCAA5", ink: "#04342C"},
    violet: {bg: "#AFA9EC", ink: "#26215C"},
    rose: {bg: "#ED93B1", ink: "#4B1528"},
    sky: {bg: "#85B7EB", ink: "#042C53"},
    lime: {bg: "#97C459", ink: "#173404"},
} as const;
export type AvatarColor = keyof typeof AVATAR_COLORS;
export const DEFAULT_AVATAR_COLOR: AvatarColor = "amber";

/** The rows on the profile, each with a "see all" page. */
export const SHELF = {
    FAVORITES: "favorites",
    MOVIES: "movies",
    SERIES: "series",
    WATCHLIST: "watchlist",
    REVIEWS: "reviews",
} as const;
export type Shelf = (typeof SHELF)[keyof typeof SHELF];

export const SHELF_SORT = {
    LAST_WATCHED: "lastWatched",
    LAST_ADDED: "lastAdded",
    ALPHABETICAL: "alphabetical",
    RELEASE_DATE: "releaseDate",
    RATING: "rating",
} as const;
export type ShelfSort = (typeof SHELF_SORT)[keyof typeof SHELF_SORT];

export const SERIES_STATUS = {
    WATCHING: "watching",
    COMPLETED: "completed",
    NOT_STARTED: "notStarted",
} as const;
export type SeriesStatus = (typeof SERIES_STATUS)[keyof typeof SERIES_STATUS];

/** Posters shown in a profile row before "see all". */
export const SHELF_PREVIEW = 4;
export const PROFILE_BIO_MAX = 160;

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

/** Where users reach the developer; shown on the privacy page, which the app stores require. */
export const CONTACT_EMAIL = "isamammadlee@gmail.com";
