import type {DiaryEntry, Library, LibraryItem, MediaSnapshot} from "@/api/library.api";
import type {ListsStore, UserList} from "@/api/lists.api";
import {toIsoDay} from "@/helpers/calendar";
import {parseDate} from "@/helpers/dates";
import {createId, updateItem} from "@/helpers/library";
import {toEntry} from "@/helpers/lists";
import {watchedAtFor} from "@/helpers/watchDate";

/* -------------------------------- CSV -------------------------------- */

/**
 * Rows of a CSV file as written by Letterboxd and spreadsheets: fields in double quotes may hold commas,
 * line breaks (reviews often do) and doubled quotes. A byte order mark at the start is skipped.
 */
export const parseCsv = (text: string): string[][] => {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let isQuoted = false;
    const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

    for (let index = 0; index < source.length; index++) {
        const char = source[index];
        if (isQuoted) {
            if (char === "\"" && source[index + 1] === "\"") {
                field += "\"";
                index++;
            } else if (char === "\"") {
                isQuoted = false;
            } else {
                field += char;
            }
        } else if (char === "\"") {
            isQuoted = true;
        } else if (char === ",") {
            row.push(field);
            field = "";
        } else if (char === "\n" || char === "\r") {
            if (char === "\r" && source[index + 1] === "\n") index++;
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
        } else {
            field += char;
        }
    }
    if (field || row.length) {
        row.push(field);
        rows.push(row);
    }
    return rows.filter((cells) => cells.some((cell) => cell.trim()));
};

/** Each row keyed by its column name in lower case, so columns are found by name, whatever their order. */
export const csvRecords = (text: string): Record<string, string>[] => {
    const [header, ...rows] = parseCsv(text);
    if (!header) return [];
    const names = header.map((name) => name.trim().toLowerCase());
    return rows.map((cells) => Object.fromEntries(names.map((name, index) => [name, (cells[index] ?? "").trim()])));
};

/* ----------------------------- the export ----------------------------- */

/** The files of a Letterboxd export this app reads, by their path inside the ZIP. */
export const LETTERBOXD_FILES = {
    DIARY: "diary.csv",
    RATINGS: "ratings.csv",
    WATCHED: "watched.csv",
    WATCHLIST: "watchlist.csv",
    REVIEWS: "reviews.csv",
    LIKES: "likes/films.csv",
} as const;
type LetterboxdFile = (typeof LETTERBOXD_FILES)[keyof typeof LETTERBOXD_FILES];

/**
 * Which export file a path is: "diary.csv" or "letterboxd-name-2026/diary.csv". Copies Letterboxd keeps of
 * deleted or orphaned entries are left out, as they are not part of the person's film life any more.
 */
export const letterboxdFileOf = (path: string): LetterboxdFile | null => {
    const normal = path.replace(/\\/g, "/").toLowerCase();
    if (/(^|\/)(deleted|orphaned)\//.test(normal)) return null;
    const files = Object.values(LETTERBOXD_FILES).sort((a, b) => b.length - a.length);
    return files.find((file) => normal === file || normal.endsWith(`/${file}`)) ?? null;
};

/** One viewing logged in the diary; the date is a calendar day, "2024-03-09". */
export type LetterboxdViewing = {date: string; rating: number | null};

/** Everything an export says about one film, gathered from all its files. */
export type LetterboxdFilm = {
    key: string;
    name: string;
    year: number | null;
    viewings: LetterboxdViewing[];
    /** When it was marked watched or rated without a diary entry: the date for a single viewing. */
    watchedOn: string | null;
    rating: number | null;
    review: {text: string; date: string} | null;
    isInWatchlist: boolean;
    isLiked: boolean;
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const dayOf = (value: string | undefined): string | null => (value && DAY.test(value) ? value : null);

/** Letterboxd's 0.5–5 half stars, as this app keeps them; anything else counts as no rating. */
export const parseRating = (value: string | undefined): number | null => {
    const rating = Number(value);
    if (!value || !Number.isFinite(rating)) return null;
    const half = Math.round(rating * 2) / 2;
    return half >= 0.5 && half <= 5 ? half : null;
};

/** Review text without the light HTML Letterboxd keeps in it (italics, links, line breaks). */
export const plainReview = (text: string): string =>
    text
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>\s*<p>/gi, "\n\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, "\"")
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim();

export const filmKey = (name: string, year: number | null): string => `${name.toLowerCase()}|${year ?? ""}`;

/**
 * Gathers the export's files (path → text) into one record per film. The diary gives each viewing with its
 * own rating; ratings, watched, watchlist, reviews and likes add the rest. Films are told apart by name and year.
 */
export const collectLetterboxd = (files: Record<string, string>): LetterboxdFilm[] => {
    const films = new Map<string, LetterboxdFilm>();
    const byFile = new Map<LetterboxdFile, Record<string, string>[]>();
    Object.entries(files).forEach(([path, text]) => {
        const file = letterboxdFileOf(path);
        if (file) byFile.set(file, [...(byFile.get(file) ?? []), ...csvRecords(text)]);
    });

    const filmFor = (record: Record<string, string>): LetterboxdFilm | null => {
        const name = record.name?.trim();
        if (!name) return null;
        const yearValue = Number(record.year);
        const year = Number.isInteger(yearValue) && yearValue > 1800 ? yearValue : null;
        const key = filmKey(name, year);
        const existing = films.get(key);
        if (existing) return existing;
        const film: LetterboxdFilm = {key, name, year, viewings: [], watchedOn: null, rating: null, review: null, isInWatchlist: false, isLiked: false};
        films.set(key, film);
        return film;
    };
    const rows = (file: LetterboxdFile) => byFile.get(file) ?? [];

    rows(LETTERBOXD_FILES.DIARY).forEach((record) => {
        const film = filmFor(record);
        const date = dayOf(record["watched date"]) ?? dayOf(record.date);
        if (film && date) film.viewings.push({date, rating: parseRating(record.rating)});
    });
    rows(LETTERBOXD_FILES.RATINGS).forEach((record) => {
        const film = filmFor(record);
        if (!film) return;
        film.rating = parseRating(record.rating) ?? film.rating;
        film.watchedOn ??= dayOf(record.date);
    });
    // Marked watched counts before the date it was rated, which may be years later.
    rows(LETTERBOXD_FILES.WATCHED).forEach((record) => {
        const film = filmFor(record);
        const date = dayOf(record.date);
        if (film && date) film.watchedOn = date;
    });
    rows(LETTERBOXD_FILES.WATCHLIST).forEach((record) => {
        const film = filmFor(record);
        if (film) film.isInWatchlist = true;
    });
    rows(LETTERBOXD_FILES.LIKES).forEach((record) => {
        const film = filmFor(record);
        if (film) film.isLiked = true;
    });
    // One review per film here, so the latest written wins.
    rows(LETTERBOXD_FILES.REVIEWS).forEach((record) => {
        const film = filmFor(record);
        const text = plainReview(record.review ?? "");
        const date = dayOf(record["watched date"]) ?? dayOf(record.date) ?? "";
        if (film && text && (!film.review || date >= film.review.date)) film.review = {text, date};
    });

    return [...films.values()].map((film) => ({...film, viewings: film.viewings.sort((a, b) => b.date.localeCompare(a.date))}));
};

export type LetterboxdSummary = {films: number; viewings: number; ratings: number; reviews: number; watchlist: number; liked: number};

/** What an import would bring, for the preview. Watched films with no diary entry count as one viewing. */
export const summarizeLetterboxd = (films: LetterboxdFilm[]): LetterboxdSummary => ({
    films: films.length,
    viewings: films.reduce((total, film) => total + (film.viewings.length || (film.watchedOn ? 1 : 0)), 0),
    ratings: films.filter((film) => film.rating !== null || film.viewings.some((viewing) => viewing.rating !== null)).length,
    reviews: films.filter((film) => film.review).length,
    watchlist: films.filter((film) => film.isInWatchlist).length,
    liked: films.filter((film) => film.isLiked).length,
});

/* ------------------------------ matching ------------------------------ */

/** A TMDB search result, as far as matching needs it. */
export type MovieCandidate = {id: number; title: string; original_title?: string; release_date?: string};

/** Titles compared without case, accents or punctuation: "Amélie" matches "Amelie", "Se7en" stays itself. */
export const normalizeTitle = (title: string): string =>
    title.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, "and").replace(/[^\p{L}\p{N}]+/gu, "");

/**
 * The TMDB film a Letterboxd entry is. Letterboxd takes its data from TMDB, so the year nearly always agrees;
 * a year off by one (a festival premiere against the release) is accepted only with the same title.
 */
export const pickMatch = (candidates: MovieCandidate[], name: string, year: number | null): MovieCandidate | null => {
    const wanted = normalizeTitle(name);
    const yearOf = (candidate: MovieCandidate) => Number((candidate.release_date ?? "").slice(0, 4)) || null;
    const isSameTitle = (candidate: MovieCandidate) =>
        normalizeTitle(candidate.title) === wanted || normalizeTitle(candidate.original_title ?? "") === wanted;

    if (year === null) return candidates.find(isSameTitle) ?? null;
    const sameYear = candidates.filter((candidate) => yearOf(candidate) === year);
    const nearYear = candidates.filter((candidate) => {
        const found = yearOf(candidate);
        return found !== null && Math.abs(found - year) === 1;
    });
    return sameYear.find(isSameTitle) ?? sameYear[0] ?? nearYear.find(isSameTitle) ?? null;
};

/* ------------------------------ merging ------------------------------- */

const viewingDay = (entry: DiaryEntry): string => {
    const date = parseDate(entry.watchedAt);
    return date ? toIsoDay(date) : entry.watchedAt.slice(0, 10);
};

/**
 * Adds what Letterboxd knows to a title without taking anything away: viewings on days already in the diary
 * are skipped, so importing the same file twice changes nothing, and an existing rating or review is kept.
 */
export const mergeLetterboxdFilm = (item: LibraryItem, film: LetterboxdFilm, now: Date): LibraryItem => {
    const known = new Set(item.diary.map(viewingDay));
    const viewings = film.viewings.length ? film.viewings : film.watchedOn && !item.diary.length ? [{date: film.watchedOn, rating: film.rating}] : [];
    const added: DiaryEntry[] = viewings
        .filter((viewing) => !known.has(viewing.date))
        .map((viewing) => {
            const day = parseDate(viewing.date) ?? now;
            return {id: createId(), watchedAt: watchedAtFor(day, now), rating: viewing.rating};
        });

    const diary = [...added, ...item.diary].sort((a, b) => b.watchedAt.localeCompare(a.watchedAt));
    const rating = item.rating ?? film.rating ?? film.viewings.find((viewing) => viewing.rating !== null)?.rating ?? null;
    // The latest viewing carries the film's rating when it has none of its own, as rating in the app does.
    const [latest, ...older] = diary;
    const rated = latest && latest.rating === null && rating !== null ? [{...latest, rating}, ...older] : diary;

    return {
        ...item,
        diary: rated,
        rating,
        isFavorite: item.isFavorite || film.isLiked,
        isInWatchlist: (item.isInWatchlist || film.isInWatchlist) && !rated.length,
        review: item.review ?? (film.review ? {text: film.review.text, updatedAt: (parseDate(film.review.date) ?? now).toISOString()} : null),
    };
};

export type LetterboxdMatch = {film: LetterboxdFilm; snapshot: MediaSnapshot};

/**
 * The library with every matched film merged in, in one write. Films known only from a list are skipped:
 * touching them would add an empty entry and then a deletion record for something never there.
 */
export const mergeLetterboxd = (library: Library, matches: LetterboxdMatch[], now: Date): Library =>
    matches.filter(({film}) => hasLibraryData(film)).reduce((next, {film, snapshot}) => updateItem(next, snapshot, (item) => mergeLetterboxdFilm(item, film, now), now.toISOString()), library);

/** Whether an export says anything about the film itself, beyond it being in a list. */
export const hasLibraryData = (film: LetterboxdFilm): boolean =>
    film.viewings.length > 0 || film.watchedOn !== null || film.rating !== null || film.review !== null || film.isInWatchlist || film.isLiked;

/* ------------------------------- lists -------------------------------- */

/** A list from the export's `lists/` folder, its films in Letterboxd's order. */
export type LetterboxdList = {
    id: string;
    name: string;
    description: string;
    films: {key: string; name: string; year: number | null}[];
};

/** Lists live in `lists/<slug>.csv`, one file each. */
export const isLetterboxdListFile = (path: string): boolean => {
    const normal = path.replace(/\\/g, "/").toLowerCase();
    return /(^|\/)lists\/[^/]+\.csv$/.test(normal) && !/(^|\/)(deleted|orphaned)\//.test(normal);
};

const yearOf = (value: string | undefined): number | null => {
    const year = Number(value);
    return Number.isInteger(year) && year > 1800 ? year : null;
};

/**
 * One list file: a version line, the list's own row (Date, Name, Tags, URL, Description), then its films
 * (Position, Name, Year, URL, Description). Columns are found by name; the id comes from the file name, so
 * importing the same list again updates it rather than adding a copy.
 */
export const parseLetterboxdList = (path: string, text: string): LetterboxdList | null => {
    const rows = parseCsv(text).map((cells) => cells.map((cell) => cell.trim()));
    const lower = rows.map((cells) => cells.map((cell) => cell.toLowerCase()));
    const metaAt = lower.findIndex((cells) => cells.includes("name") && !cells.includes("year"));
    const filmsAt = lower.findIndex((cells, index) => index > metaAt && cells.includes("name") && cells.includes("year"));
    if (filmsAt < 0) return null;

    const column = (header: string[], name: string) => header.indexOf(name);
    const metaHeader = metaAt >= 0 ? lower[metaAt] : [];
    const meta = metaAt >= 0 ? rows[metaAt + 1] ?? [] : [];
    const filmsHeader = lower[filmsAt];
    const slug = path.replace(/\\/g, "/").split("/").pop()?.replace(/\.csv$/i, "") ?? "list";

    const films = rows.slice(filmsAt + 1).flatMap((cells) => {
        const name = cells[column(filmsHeader, "name")];
        if (!name) return [];
        const year = yearOf(cells[column(filmsHeader, "year")]);
        return [{key: filmKey(name, year), name, year}];
    });
    return {
        id: `letterboxd-${slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-")}`,
        name: meta[column(metaHeader, "name")] || slug.replace(/-/g, " "),
        description: plainReview(meta[column(metaHeader, "description")] ?? ""),
        films,
    };
};

export const collectLetterboxdLists = (files: Record<string, string>): LetterboxdList[] =>
    Object.entries(files)
        .filter(([path]) => isLetterboxdListFile(path))
        .map(([path, text]) => parseLetterboxdList(path, text))
        .filter((list): list is LetterboxdList => list !== null && list.films.length > 0);

/** A list's films as plain records, so they are found on TMDB in the same pass as the rest. */
export const listFilmsToFind = (lists: LetterboxdList[], known: LetterboxdFilm[]): LetterboxdFilm[] => {
    const seen = new Set(known.map((film) => film.key));
    return lists.flatMap((list) => list.films).filter((film) => {
        if (seen.has(film.key)) return false;
        seen.add(film.key);
        return true;
    }).map((film) => ({...film, viewings: [], watchedOn: null, rating: null, review: null, isInWatchlist: false, isLiked: false}));
};

/**
 * Adds the lists to the person's own. A list imported before keeps whatever was changed in the app and only
 * gains the films it lacks; a new one keeps Letterboxd's order. Films not found on TMDB are left out.
 */
export const mergeLetterboxdLists = (store: ListsStore, lists: LetterboxdList[], snapshots: Map<string, MediaSnapshot>, nowIso: string): ListsStore => {
    const next: ListsStore = {lists: {...store.lists}, removed: {...store.removed}};
    lists.forEach((list) => {
        const entries = list.films.flatMap((film) => {
            const snapshot = snapshots.get(film.key);
            return snapshot ? [toEntry(snapshot, nowIso)] : [];
        });
        const unique = entries.filter((entry, index) => entries.findIndex((other) => other.key === entry.key) === index);
        if (!unique.length) return;

        const existing = next.lists[list.id];
        const merged: UserList = existing
            ? {...existing, entries: [...existing.entries, ...unique.filter((entry) => !existing.entries.some((own) => own.key === entry.key))], updatedAt: nowIso}
            : {id: list.id, name: list.name, description: list.description, entries: unique, createdAt: nowIso, updatedAt: nowIso};
        next.lists[list.id] = merged;
        delete next.removed?.[list.id];
    });
    return next;
};

/** How many lists, and films across them, an import would bring. */
export const listCounts = (lists: LetterboxdList[], snapshots: Map<string, MediaSnapshot>) => ({
    lists: lists.filter((list) => list.films.some((film) => snapshots.has(film.key))).length,
    entries: lists.reduce((total, list) => total + list.films.filter((film) => snapshots.has(film.key)).length, 0),
});

/** Which library key each found film became, for building list entries. */
export const snapshotsByFilm = (matches: LetterboxdMatch[]): Map<string, MediaSnapshot> =>
    new Map(matches.map(({film, snapshot}) => [film.key, snapshot]));
