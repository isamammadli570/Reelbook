import {describe, expect, it} from "vitest";
import {
    addDiaryEntry,
    airedEpisodeCount,
    createLibrary,
    formatStars,
    itemKey,
    lastAiredEpisode,
    nextEpisode,
    nextRating,
    refreshSnapshot,
    seriesProgress,
    removeDiaryEntry,
    restoreDiaryEntry,
    restoreEpisodes,
    setDiaryDate,
    snapshotOf,
    setRating,
    setReview,
    setEpisodesWatched,
    toggleEpisode,
    toggleFavorite,
    toggleFollowing,
    toggleWatchlist,
    upNextItems,
    updateItem,
} from "@/helpers/library";
import type {LibraryItem, MediaSnapshot} from "@/api/library.api";

const NOW = "2026-11-05T20:00:00.000Z";

const movie: MediaSnapshot = {id: 1, mediaType: "movie", title: "Dune", posterPath: null, backdropPath: null, year: "2024", series: null};

const series: MediaSnapshot = {
    id: 2,
    mediaType: "tv",
    title: "Severance",
    posterPath: null,
    backdropPath: null,
    year: "2022",
    series: {
        seasons: [{number: 1, episodeCount: 3}, {number: 2, episodeCount: 3}],
        lastAired: {season: 2, episode: 2},
        episodeRuntime: 50,
        network: "Apple TV+",
    },
};

const itemOf = (snapshot: MediaSnapshot, change: (item: LibraryItem) => LibraryItem): LibraryItem => {
    const library = updateItem(createLibrary(), snapshot, change, NOW);
    return library.items[itemKey(snapshot.mediaType, snapshot.id)];
};

describe("updateItem", () => {
    it("creates an item on first use and drops it once nothing is left", () => {
        const added = updateItem(createLibrary(), movie, toggleWatchlist, NOW);
        expect(added.items["movie:1"].isInWatchlist).toBe(true);

        const removed = updateItem(added, movie, toggleWatchlist, NOW);
        expect(removed.items["movie:1"]).toBeUndefined();
    });
});

describe("refreshSnapshot", () => {
    it("only updates titles the user already has", () => {
        const empty = createLibrary();
        expect(refreshSnapshot(empty, movie)).toBe(empty);

        const library = updateItem(empty, movie, toggleWatchlist, NOW);
        expect(refreshSnapshot(library, {...movie, title: "Dune: Part One"}).items["movie:1"].title).toBe("Dune: Part One");
    });
});

describe("nextRating", () => {
    it("sets, halves, then clears", () => {
        expect(nextRating(null, 4)).toBe(4);
        expect(nextRating(4, 4)).toBe(3.5);
        expect(nextRating(3.5, 4)).toBeNull();
        expect(nextRating(2, 5)).toBe(5);
    });
});

describe("setReview", () => {
    it("saves trimmed text and removes the entry when blank", () => {
        const withReview = itemOf(movie, (current) => setReview(current, "  Great score.  ", NOW));
        expect(withReview.review).toEqual({text: "Great score.", updatedAt: NOW});
        expect(setReview(withReview, "   ", NOW).review).toBeNull();
    });

    it("keeps a titled entry alive when only its review is left", () => {
        const reviewed = updateItem(createLibrary(), movie, (current) => setReview(current, "Slow but worth it.", NOW), NOW);
        expect(reviewed.items["movie:1"]).toBeDefined();
    });
});

describe("formatStars", () => {
    it("prints whole and half stars", () => {
        expect(formatStars(5)).toBe("★★★★★");
        expect(formatStars(3.5)).toBe("★★★½");
        expect(formatStars(0.5)).toBe("½");
    });
});

describe("addDiaryEntry", () => {
    it("logs a viewing with the current rating and leaves the watchlist", () => {
        const item = itemOf(movie, (current) => addDiaryEntry({...toggleWatchlist(current), rating: 4.5}, NOW));
        expect(item.diary).toHaveLength(1);
        expect(item.diary[0]).toMatchObject({watchedAt: NOW, rating: 4.5});
        expect(item.isInWatchlist).toBe(false);
    });
});

describe("setRating", () => {
    const LATER = "2026-11-06T09:00:00.000Z";

    it("logs a never-watched movie today with the rating and leaves the watchlist", () => {
        const item = itemOf(movie, (current) => setRating(toggleWatchlist(current), 4, NOW));
        expect(item.diary).toHaveLength(1);
        expect(item.diary[0]).toMatchObject({watchedAt: NOW, rating: 4});
        expect(item.isInWatchlist).toBe(false);
    });

    it("rates the latest viewing only, so older ones keep their rating", () => {
        const watchedTwice = itemOf(movie, (current) => addDiaryEntry(addDiaryEntry({...current, rating: 3}, NOW), LATER));
        const rated = setRating(watchedTwice, 4.5, LATER);
        expect(rated.diary.map((entry) => entry.rating)).toEqual([4.5, 3]);
    });

    it("clearing keeps the viewing, and series are never logged by a rating", () => {
        const watched = itemOf(movie, (current) => setRating(current, 4, NOW));
        expect(setRating(watched, null, LATER).diary).toEqual([{...watched.diary[0], rating: null}]);
        expect(itemOf(series, (current) => setRating(current, 5, NOW))).toMatchObject({rating: 5, diary: [], episodes: {}});
    });
});

describe("setDiaryDate", () => {
    it("moves a viewing and keeps the diary newest first", () => {
        const watched = itemOf(movie, (current) => addDiaryEntry(addDiaryEntry(current, "2026-10-01T20:00:00.000Z"), NOW));
        const [latest, older] = watched.diary;
        const moved = setDiaryDate(watched, latest.id, "2026-09-01T20:00:00.000Z");
        expect(moved.diary.map((entry) => entry.id)).toEqual([older.id, latest.id]);
    });
});

describe("removeDiaryEntry", () => {
    it("clears the rating with the last viewing, but keeps favourite, watchlist and review", () => {
        const watched = itemOf(movie, (current) => addDiaryEntry({...toggleFavorite(toggleWatchlist(current)), rating: 4, review: {text: "Good", updatedAt: NOW}}, NOW));
        const removed = removeDiaryEntry(watched, watched.diary[0].id);
        expect(removed).toMatchObject({rating: null, isFavorite: true, review: {text: "Good"}});
    });

    it("keeps the rating while another viewing is left, and undo brings both back", () => {
        const twice = itemOf(movie, (current) => addDiaryEntry(addDiaryEntry({...current, rating: 4}, "2026-10-01T20:00:00.000Z"), NOW));
        expect(removeDiaryEntry(twice, twice.diary[0].id).rating).toBe(4);
        const once = itemOf(movie, (current) => addDiaryEntry({...current, rating: 3.5}, NOW));
        const restored = restoreDiaryEntry(removeDiaryEntry(once, once.diary[0].id), once.diary[0], once.rating);
        expect(restored).toMatchObject({rating: 3.5, diary: once.diary});
    });
});

describe("undo", () => {
    it("puts a deleted viewing back with its own id, date and rating, in date order", () => {
        const watched = itemOf(movie, (current) => addDiaryEntry(addDiaryEntry({...current, rating: 4}, "2026-10-01T20:00:00.000Z"), NOW));
        const removed = watched.diary[1];
        const restored = restoreDiaryEntry(removeDiaryEntry(watched, removed.id), removed);
        expect(restored.diary).toEqual(watched.diary);
    });

    it("brings unmarked episodes back with the dates they were first marked on", () => {
        const marked = itemOf(series, (current) => setEpisodesWatched(current, 1, [1, 2], true, "2026-10-01T20:00:00.000Z"));
        const cleared = setEpisodesWatched(marked, 1, [1, 2], false, NOW);
        expect(restoreEpisodes(cleared, marked.episodes).episodes).toEqual(marked.episodes);
    });
});

describe("episodes", () => {
    it("marking an episode follows the series and toggles back off", () => {
        const item = itemOf(series, (current) => toggleEpisode(current, {season: 1, episode: 1}, NOW));
        expect(item.isFollowing).toBe(true);
        expect(item.episodes["1:1"]).toBe(NOW);
        expect(toggleEpisode(item, {season: 1, episode: 1}, NOW).episodes["1:1"]).toBeUndefined();
    });

    it("marks and unmarks a whole season", () => {
        const item = itemOf(series, (current) => setEpisodesWatched(current, 1, [1, 2, 3], true, NOW));
        expect(Object.keys(item.episodes)).toEqual(["1:1", "1:2", "1:3"]);
        expect(setEpisodesWatched(item, 1, [1, 2, 3], false, NOW).episodes).toEqual({});
    });

    it("starting a series removes it from the watchlist", () => {
        const item = itemOf(series, (current) => toggleFollowing(toggleWatchlist(current)));
        expect(item.isFollowing).toBe(true);
        expect(item.isInWatchlist).toBe(false);
    });
});

describe("series progress", () => {
    it("counts only aired episodes", () => {
        expect(airedEpisodeCount(series.series!)).toBe(5);
    });

    it("reports watched vs aired and the next episode", () => {
        const item = itemOf(series, (current) => setEpisodesWatched(current, 1, [1, 2, 3], true, NOW));
        expect(seriesProgress(item)).toEqual({watched: 3, aired: 5, percent: 60});
        expect(nextEpisode(item)).toEqual({season: 2, episode: 1});
    });

    it("has no next episode when caught up with what aired", () => {
        const caughtUp = itemOf(series, (current) => setEpisodesWatched(setEpisodesWatched(current, 1, [1, 2, 3], true, NOW), 2, [1, 2], true, NOW));
        expect(nextEpisode(caughtUp)).toBeNull();
        expect(seriesProgress(caughtUp).percent).toBe(100);
    });

    it("skips gaps the user left behind", () => {
        const item = itemOf(series, (current) => setEpisodesWatched(current, 1, [1, 3], true, NOW));
        expect(nextEpisode(item)).toEqual({season: 1, episode: 2});
    });
});

describe("lastAiredEpisode", () => {
    const today = new Date(2026, 10, 5, 22, 0);
    const episode = (season_number: number, episode_number: number, air_date: string) => ({id: 1, name: "", season_number, episode_number, air_date, runtime: null});

    it("counts a 'next' episode whose date has passed as aired", () => {
        expect(lastAiredEpisode({last_episode_to_air: episode(1, 6, "2024-12-05"), next_episode_to_air: episode(2, 1, "2026-11-05")}, today)).toEqual({season: 2, episode: 1});
    });

    it("keeps TMDB's last episode while the next one is still ahead", () => {
        expect(lastAiredEpisode({last_episode_to_air: episode(1, 6, "2024-12-05"), next_episode_to_air: episode(2, 1, "2026-12-01")}, today)).toEqual({season: 1, episode: 6});
        expect(lastAiredEpisode({last_episode_to_air: null, next_episode_to_air: null}, today)).toBeNull();
    });
});

describe("upNextItems", () => {
    it("lists followed series with an episode left, latest activity first", () => {
        let library = updateItem(createLibrary(), series, (current) => toggleEpisode(current, {season: 1, episode: 1}, NOW), NOW);
        const other = {...series, id: 3, title: "Andor"};
        library = updateItem(library, other, (current) => toggleEpisode(current, {season: 1, episode: 1}, NOW), "2026-11-06T10:00:00.000Z");

        expect(upNextItems(library).map((entry) => entry.item.title)).toEqual(["Andor", "Severance"]);
    });
});

describe("snapshotOf", () => {
    it("keeps only the title's details, never the diary or rating", () => {
        const watched = itemOf(movie, (current) => addDiaryEntry({...current, rating: 4}, NOW));
        const snapshot = snapshotOf(watched);
        expect(snapshot).not.toHaveProperty("diary");
        expect(snapshot).not.toHaveProperty("rating");
        expect(snapshot).toMatchObject({id: movie.id, title: movie.title, mediaType: "movie"});
    });
});
