import {monthlyMinutes, summarize, topGenres, watchesInYear, watchTime, type Watch} from "@/helpers/stats";
import type {MediaType} from "@/constants/other";

/** A title on the card: its poster and the stars the user gave. */
export type RecapTitle = {
    id: number;
    mediaType: MediaType;
    title: string;
    posterPath: string | null;
    rating: number | null;
};

/** Everything the "year in review" card shows, worked out from the diary of one calendar year. */
export type Recap = {
    year: number;
    hours: number;
    days: number;
    movies: number;
    episodes: number;
    series: number;
    averageRating: number | null;
    genres: string[];
    /** Zero-based month with the most watch time, or `null` when nothing has a runtime. */
    busiestMonth: number | null;
    /** The best-loved titles of the year (highest stars first), with a poster each. */
    titles: RecapTitle[];
};

/** Titles shown as posters on the card. */
export const RECAP_TITLES = 3;

/**
 * Best-rated titles first; unrated ones follow by how recently they were watched. Each title once, and only
 * those with a poster, since the card shows pictures.
 */
const bestTitles = (watches: Watch[], limit: number): RecapTitle[] => {
    const latest = new Map<string, Watch>();
    watches.forEach((watch) => {
        const key = `${watch.item.mediaType}:${watch.item.id}`;
        const current = latest.get(key);
        if (!current || watch.watchedAt > current.watchedAt) latest.set(key, watch);
    });
    return [...latest.values()]
        .filter((watch) => watch.item.posterPath)
        .sort((a, b) => (b.item.rating ?? -1) - (a.item.rating ?? -1) || b.watchedAt.localeCompare(a.watchedAt))
        .slice(0, limit)
        .map(({item}) => ({id: item.id, mediaType: item.mediaType, title: item.title, posterPath: item.posterPath, rating: item.rating}));
};

/** The year in review for `year`; `null` when nothing was watched in it. */
export const buildRecap = (watches: Watch[], year: number): Recap | null => {
    const scoped = watchesInYear(watches, year);
    if (!scoped.length) return null;

    const summary = summarize(scoped);
    const months = monthlyMinutes(watches, year);
    const peak = Math.max(...months);
    return {
        year,
        ...watchTime(summary.minutes),
        movies: summary.movies,
        episodes: summary.episodes,
        series: summary.series,
        averageRating: summary.averageRating,
        genres: topGenres(scoped, 3).map((genre) => genre.name),
        busiestMonth: peak > 0 ? months.indexOf(peak) : null,
        titles: bestTitles(scoped, RECAP_TITLES),
    };
};

/** Years that have something to review, newest first: the choices on the recap screen. */
export const recapYears = (watches: Watch[]): number[] =>
    [...new Set(watches.map((watch) => new Date(watch.watchedAt).getFullYear()))].filter((year) => !Number.isNaN(year)).sort((a, b) => b - a);
