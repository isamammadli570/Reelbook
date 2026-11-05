export const ROUTES = {
    HOME: "/",
    DISCOVER: "/discover",
    CALENDAR: "/calendar",
    STATS: "/stats",
    PROFILE: "/profile",
    MOVIE: "/movie/[id]",
    SERIES: "/series/[id]",
} as const;

export const buildRoute = {
    movie: (movieId: number) => `/movie/${movieId}`,
    series: (seriesId: number) => `/series/${seriesId}`,
    media: (media: {id: number; media_type: "movie" | "tv"}) => (media.media_type === "tv" ? buildRoute.series(media.id) : buildRoute.movie(media.id)),
};
