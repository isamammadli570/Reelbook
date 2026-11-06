import {Platform} from "react-native";
import {File} from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import {strFromU8, unzipSync} from "fflate";
import {api} from "@/api/client";
import {getMovieSnapshot, withRetry} from "@/api/importSnapshots.api";
import {mergeIntoLibrary, type MediaSnapshot} from "@/api/library.api";
import type {Paged} from "@/api/media.api";
import {API_ENDPOINTS} from "@/constants/endpoints";
import {mergeIntoLists} from "@/api/lists.api";
import {
    isLetterboxdListFile,
    letterboxdFileOf,
    mergeLetterboxd,
    mergeLetterboxdLists,
    pickMatch,
    snapshotsByFilm,
    type LetterboxdFilm,
    type LetterboxdList,
    type LetterboxdMatch,
    type MovieCandidate,
} from "@/helpers/letterboxd";

const isWeb = Platform.OS === "web";

/** ZIP and CSV under the names phones and browsers give them; some Android file apps only offer "any file". */
const IMPORT_TYPES = ["application/zip", "application/x-zip-compressed", "text/csv", "text/comma-separated-values", "application/octet-stream"];

export type PickedExport = {status: "cancelled"} | {status: "invalid"} | {status: "picked"; files: Record<string, string>};

/** Lets the person pick their Letterboxd export (the ZIP, or one of its CSV files) and reads the files the app uses. */
export const pickLetterboxdExport = async (): Promise<PickedExport> => {
    const picked = await DocumentPicker.getDocumentAsync({type: IMPORT_TYPES, copyToCacheDirectory: true});
    const asset = picked.canceled ? null : picked.assets?.[0];
    if (!asset) return {status: "cancelled"};

    // On the web the picker hands over the browser's own File; on a phone, a copy in the app's cache.
    const bytes = isWeb && asset.file ? new Uint8Array(await asset.file.arrayBuffer()) : await new File(asset.uri).bytes();
    const name = asset.name.toLowerCase();
    // A ZIP starts with "PK"; checked by content, since some pickers lose the extension.
    const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;

    let files: Record<string, string> = {};
    if (isZip) {
        const entries = unzipSync(bytes, {filter: (entry) => letterboxdFileOf(entry.name) !== null || isLetterboxdListFile(entry.name)});
        files = Object.fromEntries(Object.entries(entries).map(([path, data]) => [path, strFromU8(data)]));
    } else if (letterboxdFileOf(name)) {
        files = {[name]: strFromU8(bytes)};
    }
    return Object.keys(files).length ? {status: "picked", files} : {status: "invalid"};
};

const searchMovies = (query: string, year: number | null) =>
    withRetry(() => api.get<Paged<MovieCandidate>>(API_ENDPOINTS.SEARCH_MOVIE, {params: {query, include_adult: false, ...(year ? {primary_release_year: year} : {})}}));

/** The TMDB film behind a Letterboxd entry, with genres, runtime and people for statistics; `null` when none fits. */
export const findLetterboxdFilm = async (film: LetterboxdFilm): Promise<MediaSnapshot | null> => {
    let match = film.year ? pickMatch((await searchMovies(film.name, film.year)).results, film.name, film.year) : null;
    // Without the year, for a release a year apart or an entry with no year at all.
    match ??= pickMatch((await searchMovies(film.name, null)).results, film.name, film.year);
    if (!match) return null;

    return getMovieSnapshot(match.id);
};

/** Requests at once: quick enough for a big diary while staying under TMDB's rate limit. */
const CONCURRENCY = 6;

export type MatchResult = {matched: LetterboxdMatch[]; unmatched: LetterboxdFilm[]};

/** Finds every film on TMDB, a few at a time, reporting how many are done; one failing never stops the rest. */
export const matchLetterboxdFilms = async (
    films: LetterboxdFilm[],
    onProgress: (done: number) => void,
    signal?: {isCancelled: boolean},
): Promise<MatchResult> => {
    const matched: LetterboxdMatch[] = [];
    const unmatched: LetterboxdFilm[] = [];
    let next = 0;
    let done = 0;

    const worker = async () => {
        while (next < films.length && !signal?.isCancelled) {
            const film = films[next++];
            try {
                const snapshot = await findLetterboxdFilm(film);
                if (snapshot) matched.push({film, snapshot});
                else unmatched.push(film);
            } catch {
                unmatched.push(film);
            }
            onProgress(++done);
        }
    };
    await Promise.all(Array.from({length: Math.min(CONCURRENCY, films.length)}, worker));
    return {matched, unmatched: unmatched.sort((a, b) => a.name.localeCompare(b.name))};
};

/** Writes the matched films into the library and the lists into the person's lists; the usual sync carries both to the account. */
export const importLetterboxdMatches = async (matches: LetterboxdMatch[], lists: LetterboxdList[]): Promise<void> => {
    const now = new Date();
    await mergeIntoLibrary((library) => mergeLetterboxd(library, matches, now));
    if (lists.length) await mergeIntoLists((store) => mergeLetterboxdLists(store, lists, snapshotsByFilm(matches), now.toISOString()));
};
