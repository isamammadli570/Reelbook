import {storage} from "@/lib/storage";
import {STORAGE_KEYS, type MediaType} from "@/constants/other";
import {
    addDiaryEntry,
    createLibrary,
    removeDiaryEntry,
    setEpisodesWatched,
    setRating,
    toggleEpisode,
    toggleFavorite,
    toggleFollowing,
    toggleWatchlist,
    updateItem,
    refreshSnapshot,
} from "@/helpers/library";

/** What the app remembers about a title even when TMDB is not asked: enough to draw a poster card. */
export type MediaSnapshot = {
    id: number;
    mediaType: MediaType;
    title: string;
    posterPath: string | null;
    backdropPath: string | null;
    year: string;
    /** Genre names for statistics; optional because items saved before stats existed lack it. */
    genres?: string[];
    /** Movie runtime in minutes, for watch-time totals (series keep theirs per episode in `series`). */
    runtime?: number | null;
    /** Series only: the season layout and how far it has aired, for progress and "up next". */
    series: SeriesSnapshot | null;
};

export type SeriesSnapshot = {
    seasons: {number: number; episodeCount: number}[];
    lastAired: EpisodeRef | null;
    episodeRuntime: number | null;
    network: string | null;
};

export type EpisodeRef = {season: number; episode: number};

/** One viewing of a movie. */
export type DiaryEntry = {
    id: string;
    watchedAt: string;
    rating: number | null;
};

export type LibraryItem = MediaSnapshot & {
    addedAt: string;
    updatedAt: string;
    isInWatchlist: boolean;
    isFavorite: boolean;
    /** Series the user is watching; set automatically when an episode is marked. */
    isFollowing: boolean;
    /** 0.5–5 in half steps. */
    rating: number | null;
    diary: DiaryEntry[];
    /** Watched episodes: `episodeKey(season, episode)` → ISO date. */
    episodes: Record<string, string>;
};

export type Library = {
    items: Record<string, LibraryItem>;
};

/* ------------------------------ storage ------------------------------ */

export const getLibrary = async (): Promise<Library> => (await storage.get<Library>(STORAGE_KEYS.LIBRARY)) ?? createLibrary();

// Writes run one after another so two quick taps never overwrite each other's read-modify-write.
let writeQueue: Promise<unknown> = Promise.resolve();

const modifyLibrary = (change: (library: Library) => Library): Promise<Library> => {
    const run = writeQueue.then(async () => {
        const next = change(await getLibrary());
        await storage.set(STORAGE_KEYS.LIBRARY, next);
        return next;
    });
    writeQueue = run.catch(() => undefined);
    return run;
};

/* ----------------------------- mutations ----------------------------- */

const now = (): string => new Date().toISOString();

export const toggleWatchlistItem = (snapshot: MediaSnapshot) => modifyLibrary((library) => updateItem(library, snapshot, (item) => toggleWatchlist(item), now()));

export const toggleFavoriteItem = (snapshot: MediaSnapshot) => modifyLibrary((library) => updateItem(library, snapshot, (item) => toggleFavorite(item), now()));

export const toggleFollowingItem = (snapshot: MediaSnapshot) => modifyLibrary((library) => updateItem(library, snapshot, (item) => toggleFollowing(item), now()));

export const rateItem = ({snapshot, rating}: {snapshot: MediaSnapshot; rating: number | null}) =>
    modifyLibrary((library) => updateItem(library, snapshot, (item) => setRating(item, rating), now()));

export const logWatch = ({snapshot, watchedAt}: {snapshot: MediaSnapshot; watchedAt?: string}) =>
    modifyLibrary((library) => updateItem(library, snapshot, (item) => addDiaryEntry(item, watchedAt ?? now()), now()));

export const deleteWatch = ({snapshot, entryId}: {snapshot: MediaSnapshot; entryId: string}) =>
    modifyLibrary((library) => updateItem(library, snapshot, (item) => removeDiaryEntry(item, entryId), now()));

export const toggleEpisodeWatched = ({snapshot, episode}: {snapshot: MediaSnapshot; episode: EpisodeRef}) =>
    modifyLibrary((library) => updateItem(library, snapshot, (item) => toggleEpisode(item, episode, now()), now()));

export const setSeasonWatched = ({snapshot, season, episodes, isWatched}: {snapshot: MediaSnapshot; season: number; episodes: number[]; isWatched: boolean}) =>
    modifyLibrary((library) => updateItem(library, snapshot, (item) => setEpisodesWatched(item, season, episodes, isWatched, now()), now()));

/** Keeps a stored series' season layout current without creating an entry for unseen titles. */
export const refreshItemSnapshot = (snapshot: MediaSnapshot) => modifyLibrary((library) => refreshSnapshot(library, snapshot));
