import type {EpisodeRef, Library, LibraryItem, PersonRef} from "@/api/library.api";
import {MEDIA_TYPE, type MediaType} from "@/constants/other";

/** One thing watched at one moment: a movie viewing or a single episode. */
export type Watch = {
    kind: MediaType;
    item: LibraryItem;
    watchedAt: string;
    minutes: number;
    episode: EpisodeRef | null;
};

export type StatsSummary = {
    minutes: number;
    movies: number;
    episodes: number;
    series: number;
    averageRating: number | null;
};

const parseEpisodeKey = (key: string): EpisodeRef => {
    const [season, episode] = key.split(":").map(Number);
    return {season, episode};
};

/** Every viewing in the library, newest first. */
export const collectWatches = (library: Library): Watch[] =>
    Object.values(library.items)
        .flatMap((item): Watch[] => {
            if (item.mediaType === MEDIA_TYPE.MOVIE) {
                return item.diary.map((entry) => ({kind: MEDIA_TYPE.MOVIE, item, watchedAt: entry.watchedAt, minutes: item.runtime ?? 0, episode: null}));
            }
            return Object.entries(item.episodes).map(([key, watchedAt]) => ({
                kind: MEDIA_TYPE.TV,
                item,
                watchedAt,
                minutes: item.series?.episodeRuntime ?? 0,
                episode: parseEpisodeKey(key),
            }));
        })
        .sort((a, b) => b.watchedAt.localeCompare(a.watchedAt));

/** `null` keeps all time. Years follow the device's local calendar. */
export const watchesInYear = (watches: Watch[], year: number | null): Watch[] =>
    year === null ? watches : watches.filter((watch) => new Date(watch.watchedAt).getFullYear() === year);

export const summarize = (watches: Watch[]): StatsSummary => {
    const movies = new Set<string>();
    const series = new Set<string>();
    const rated = new Map<string, number>();
    let minutes = 0;
    let episodes = 0;

    watches.forEach((watch) => {
        const key = `${watch.item.mediaType}:${watch.item.id}`;
        minutes += watch.minutes;
        if (watch.kind === MEDIA_TYPE.MOVIE) movies.add(key);
        else {
            series.add(key);
            episodes += 1;
        }
        if (watch.item.rating !== null) rated.set(key, watch.item.rating);
    });

    const ratings = [...rated.values()];
    return {
        minutes,
        movies: movies.size,
        episodes,
        series: series.size,
        averageRating: ratings.length ? Math.round((ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 10) / 10 : null,
    };
};

/** Minutes watched per calendar month of `year`, January first. */
export const monthlyMinutes = (watches: Watch[], year: number): number[] => {
    const months = Array.from({length: 12}, () => 0);
    watchesInYear(watches, year).forEach((watch) => {
        months[new Date(watch.watchedAt).getMonth()] += watch.minutes;
    });
    return months;
};

/** Genres by share of watch time, so a 10-episode series is not outweighed by one film tag. */
export const topGenres = (watches: Watch[], limit = 3): {name: string; percent: number}[] => {
    const totals = new Map<string, number>();
    let total = 0;
    watches.forEach((watch) => {
        // Unknown runtimes still count, as one minute, so genres of titles without runtime are not lost.
        const weight = watch.minutes || 1;
        (watch.item.genres ?? []).forEach((genre) => {
            totals.set(genre, (totals.get(genre) ?? 0) + weight);
            total += weight;
        });
    });
    return [...totals.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name, weight]) => ({name, percent: Math.round((weight / total) * 100)}));
};

/** The series with the most episodes watched in the given watches. */
export const topSeries = (watches: Watch[]): {item: LibraryItem; episodes: number; minutes: number} | null => {
    const counts = new Map<string, {item: LibraryItem; episodes: number; minutes: number}>();
    watches.filter((watch) => watch.kind === MEDIA_TYPE.TV).forEach((watch) => {
        const key = String(watch.item.id);
        const entry = counts.get(key) ?? {item: watch.item, episodes: 0, minutes: 0};
        counts.set(key, {...entry, episodes: entry.episodes + 1, minutes: entry.minutes + watch.minutes});
    });
    return [...counts.values()].sort((a, b) => b.episodes - a.episodes)[0] ?? null;
};

const localDay = (iso: string): string => {
    const date = new Date(iso);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

/** Most episodes of one series watched on a single day; a "marathon" needs at least two. */
export const longestMarathon = (watches: Watch[]): {item: LibraryItem; episodes: number; watchedAt: string} | null => {
    const days = new Map<string, {item: LibraryItem; episodes: number; watchedAt: string}>();
    watches.filter((watch) => watch.kind === MEDIA_TYPE.TV).forEach((watch) => {
        const key = `${watch.item.id}|${localDay(watch.watchedAt)}`;
        const entry = days.get(key) ?? {item: watch.item, episodes: 0, watchedAt: watch.watchedAt};
        days.set(key, {...entry, episodes: entry.episodes + 1});
    });
    const best = [...days.values()].sort((a, b) => b.episodes - a.episodes)[0];
    return best && best.episodes >= 2 ? best : null;
};

/** Watch time as months (of 30 days), days and hours, like "1mo 4d 15h" on the profile. */
export const splitWatchTime = (minutes: number): {months: number; days: number; hours: number} => {
    const totalHours = Math.floor(minutes / 60);
    const months = Math.floor(totalHours / (24 * 30));
    const rest = totalHours - months * 24 * 30;
    return {months, days: Math.floor(rest / 24), hours: rest % 24};
};

/** Whole hours, and the same time expressed in days, for the big headline number. */
export const watchTime = (minutes: number): {hours: number; days: number} => ({
    hours: Math.round(minutes / 60),
    days: Math.round((minutes / 60 / 24) * 10) / 10,
});

/** The half-star steps a rating can take, lowest first: 0.5, 1, … 5. */
export const RATING_STEPS = Array.from({length: 10}, (_, index) => (index + 1) / 2);

/**
 * How many titles got each rating, 0.5 to 5, counting each title once with its current rating:
 * the bars of a Letterboxd-style ratings chart.
 */
export const ratingDistribution = (watches: Watch[]): {counts: number[]; total: number} => {
    const rated = new Map<string, number>();
    watches.forEach((watch) => {
        if (watch.item.rating !== null) rated.set(`${watch.item.mediaType}:${watch.item.id}`, watch.item.rating);
    });
    const counts = RATING_STEPS.map(() => 0);
    rated.forEach((rating) => {
        const index = Math.round(rating * 2) - 1;
        if (index >= 0 && index < counts.length) counts[index] += 1;
    });
    return {counts, total: rated.size};
};

/** A person with how many titles they made or appeared in, for the "most watched" rows. */
export type PersonCount = {person: PersonRef; titles: number};

/**
 * The people behind most of what was watched: directors of films, or actors across films and series.
 * Each title counts once however often it was watched, as on Letterboxd; ties go to the name.
 */
export const topPeople = (watches: Watch[], role: "directors" | "cast", limit = 6): PersonCount[] => {
    const seen = new Set<string>();
    const counts = new Map<number, PersonCount>();
    watches.forEach((watch) => {
        if (role === "directors" && watch.kind !== MEDIA_TYPE.MOVIE) return;
        const key = `${watch.item.mediaType}:${watch.item.id}`;
        if (seen.has(key)) return;
        seen.add(key);
        (watch.item.people?.[role] ?? []).forEach((person) => {
            const entry = counts.get(person.id) ?? {person, titles: 0};
            counts.set(person.id, {...entry, titles: entry.titles + 1});
        });
    });
    return [...counts.values()]
        .filter((entry) => entry.titles >= 2)
        .sort((a, b) => b.titles - a.titles || a.person.name.localeCompare(b.person.name))
        .slice(0, limit);
};
