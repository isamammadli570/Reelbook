import {storage} from "@/lib/storage";
import {STORAGE_KEYS, type MediaType} from "@/constants/other";
import {
    setPeople,
    addDiaryEntry,
    createLibrary,
    removeDiaryEntry,
    restoreDiaryEntry,
    restoreEpisodes,
    setDiaryDate,
    setEpisodesWatched,
    setRating,
    toggleEpisode,
    toggleFavorite,
    toggleFollowing,
    toggleWatchlist,
    updateItem,
    refreshSnapshot,
    setReview,
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
    /** Who directed and who stars, for the most-watched people in stats; filled in later for older items. */
    people?: TitlePeople;
};

/** A person as a title remembers them: enough for a round portrait that opens their page. */
export type PersonRef = {id: number; name: string; profilePath: string | null};

export type TitlePeople = {directors: PersonRef[]; cast: PersonRef[]};

export type SeriesSnapshot = {
    seasons: {number: number; episodeCount: number}[];
    lastAired: EpisodeRef | null;
    episodeRuntime: number | null;
    network: string | null;
};

export type EpisodeRef = {season: number; episode: number};

/** The user's own written thoughts on a title; one per title, edited in place. */
export type Review = {
    text: string;
    updatedAt: string;
};

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
    /** Optional so entries saved before reviews existed still read correctly. */
    review?: Review | null;
};

export type Library = {
    items: Record<string, LibraryItem>;
    /** When each removed title was last deleted, so the deletion can reach other devices. */
    removed?: Record<string, string>;
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

/** An empty text removes the review. */
export const saveReview = ({snapshot, text}: {snapshot: MediaSnapshot; text: string}) =>
    modifyLibrary((library) => updateItem(library, snapshot, (item) => setReview(item, text, now()), now()));

export const rateItem =({snapshot, rating}: {snapshot: MediaSnapshot; rating: number | null}) =>
    modifyLibrary((library) => updateItem(library, snapshot, (item) => setRating(item, rating, now()), now()));

export const logWatch = ({snapshot, watchedAt}: {snapshot: MediaSnapshot; watchedAt?: string}) =>
    modifyLibrary((library) => updateItem(library, snapshot, (item) => addDiaryEntry(item, watchedAt ?? now()), now()));

export const deleteWatch = ({snapshot, entryId}: {snapshot: MediaSnapshot; entryId: string}) =>
    modifyLibrary((library) => updateItem(library, snapshot, (item) => removeDiaryEntry(item, entryId), now()));

export const restoreWatch = ({snapshot, entry, rating}: {snapshot: MediaSnapshot; entry: DiaryEntry; rating?: number | null}) =>
    modifyLibrary((library) => updateItem(library, snapshot, (item) => restoreDiaryEntry(item, entry, rating), now()));

export const restoreWatchedEpisodes = ({snapshot, episodes}: {snapshot: MediaSnapshot; episodes: Record<string, string>}) =>
    modifyLibrary((library) => updateItem(library, snapshot, (item) => restoreEpisodes(item, episodes), now()));

export const changeWatchDate = ({snapshot, entryId, watchedAt}: {snapshot: MediaSnapshot; entryId: string; watchedAt: string}) =>
    modifyLibrary((library) => updateItem(library, snapshot, (item) => setDiaryDate(item, entryId, watchedAt), now()));

export const toggleEpisodeWatched = ({snapshot, episode}: {snapshot: MediaSnapshot; episode: EpisodeRef}) =>
    modifyLibrary((library) => updateItem(library, snapshot, (item) => toggleEpisode(item, episode, now()), now()));

export const setSeasonWatched = ({snapshot, season, episodes, isWatched}: {snapshot: MediaSnapshot; season: number; episodes: number[]; isWatched: boolean}) =>
    modifyLibrary((library) => updateItem(library, snapshot, (item) => setEpisodesWatched(item, season, episodes, isWatched, now()), now()));

/** Applies a change to the whole library in one write, used by imports. */
export const mergeIntoLibrary = (change: (library: Library) => Library) => modifyLibrary(change);

/** Replaces the whole library, used when a backup is restored. */
export const replaceLibrary = (library: Library) => modifyLibrary(() => library);

/** Stores who made and stars in titles, found after they were saved; quiet, so it does not count as an edit to sync. */
export const storePeople = (people: Record<string, TitlePeople>) => modifyLibrary((library) => setPeople(library, people));

/** Keeps a stored series' season layout current without creating an entry for unseen titles. */
export const refreshItemSnapshot = (snapshot: MediaSnapshot) => modifyLibrary((library) => refreshSnapshot(library, snapshot));
