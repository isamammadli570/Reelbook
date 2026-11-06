export const TMDB_BASE_API = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export const API_ENDPOINTS = {
    TRENDING: "/trending",
    MOVIE: "/movie",
    TV: "/tv",
    SEARCH: "/search/multi",
    SEARCH_MOVIE: "/search/movie",
    NOW_PLAYING: "/movie/now_playing",
    ON_THE_AIR: "/tv/on_the_air",
    DISCOVER_MOVIE: "/discover/movie",
    DISCOVER_TV: "/discover/tv",
    PERSON: "/person",
    COLLECTION: "/collection",
    UPCOMING: "/movie/upcoming",
    AIRING_TODAY: "/tv/airing_today",
    WATCH_PROVIDERS: "/watch/providers",
    FIND: "/find",
} as const;
