import {describe, expect, it} from "vitest";
import {coverChoices, groupByStatus, lastWatchedAt, seriesStatus, shelfItems, sortShelf} from "@/helpers/shelves";
import {addDiaryEntry, createLibrary, setEpisodesWatched, toggleFavorite, toggleFollowing, toggleWatchlist, updateItem} from "@/helpers/library";
import type {Library, LibraryItem, MediaSnapshot} from "@/api/library.api";

const movie = (id: number, title: string, year: string): MediaSnapshot => ({id, mediaType: "movie", title, posterPath: null, backdropPath: null, year, series: null});

const series = (id: number, title: string): MediaSnapshot => ({
    id,
    mediaType: "tv",
    title,
    posterPath: null,
    backdropPath: null,
    year: "2022",
    series: {seasons: [{number: 1, episodeCount: 2}], lastAired: {season: 1, episode: 2}, episodeRuntime: 50, network: null},
});

const add = (library: Library, snapshot: MediaSnapshot, change: (item: LibraryItem) => LibraryItem, at: string): Library => updateItem(library, snapshot, change, at);

let library = createLibrary();
library = add(library, movie(1, "Dune", "2024"), (item) => addDiaryEntry(item, "2026-11-03T20:00:00.000Z"), "2026-11-01T10:00:00.000Z");
library = add(library, movie(2, "Arrival", "2016"), (item) => toggleFavorite(addDiaryEntry(item, "2026-11-05T20:00:00.000Z")), "2026-11-02T10:00:00.000Z");
library = add(library, movie(3, "Past Lives", "2023"), toggleWatchlist, "2026-11-04T10:00:00.000Z");
library = add(library, series(10, "Severance"), (item) => setEpisodesWatched(item, 1, [1], true, "2026-11-04T21:00:00.000Z"), "2026-11-04T21:00:00.000Z");
library = add(library, series(11, "Dark"), (item) => setEpisodesWatched(item, 1, [1, 2], true, "2026-11-02T21:00:00.000Z"), "2026-11-02T21:00:00.000Z");
library = add(library, series(12, "Andor"), toggleFollowing, "2026-11-03T21:00:00.000Z");

const titles = (items: LibraryItem[]) => items.map((item) => item.title);

describe("shelfItems", () => {
    it("puts each title on the rows it belongs to", () => {
        expect(titles(shelfItems(library, "favorites"))).toEqual(["Arrival"]);
        expect(titles(sortShelf(shelfItems(library, "movies"), "alphabetical"))).toEqual(["Arrival", "Dune"]);
        expect(titles(sortShelf(shelfItems(library, "series"), "alphabetical"))).toEqual(["Andor", "Dark", "Severance"]);
        expect(titles(shelfItems(library, "watchlist"))).toEqual(["Past Lives"]);
    });
});

describe("lastWatchedAt", () => {
    it("takes the latest viewing or episode", () => {
        expect(lastWatchedAt(library.items["movie:2"])).toBe("2026-11-05T20:00:00.000Z");
        expect(lastWatchedAt(library.items["movie:3"])).toBeNull();
    });
});

describe("sortShelf", () => {
    it("orders by last watched, last added, title and release year", () => {
        const movies = shelfItems(library, "movies");
        expect(titles(sortShelf(movies, "lastWatched"))).toEqual(["Arrival", "Dune"]);
        expect(titles(sortShelf(movies, "lastAdded"))).toEqual(["Arrival", "Dune"]);
        expect(titles(sortShelf(movies, "releaseDate"))).toEqual(["Dune", "Arrival"]);
    });
});

describe("coverChoices", () => {
    it("lists favourites' backdrops first and skips titles without one", () => {
        let withBackdrops = createLibrary();
        withBackdrops = add(withBackdrops, {...movie(1, "Dune", "2024"), backdropPath: "/dune.jpg"}, toggleWatchlist, "2026-11-05T10:00:00.000Z");
        withBackdrops = add(withBackdrops, {...movie(2, "Arrival", "2016"), backdropPath: "/arrival.jpg"}, toggleFavorite, "2026-11-01T10:00:00.000Z");
        withBackdrops = add(withBackdrops, movie(3, "No image", "2020"), toggleWatchlist, "2026-11-06T10:00:00.000Z");
        expect(coverChoices(withBackdrops)).toEqual([
            {path: "/arrival.jpg", title: "Arrival"},
            {path: "/dune.jpg", title: "Dune"},
        ]);
    });
});

describe("series status", () => {
    it("tells watching, completed and not started apart", () => {
        expect(seriesStatus(library.items["tv:10"])).toBe("watching");
        expect(seriesStatus(library.items["tv:11"])).toBe("completed");
        expect(seriesStatus(library.items["tv:12"])).toBe("notStarted");
    });

    it("groups in the order watching, not started, completed", () => {
        const groups = groupByStatus(shelfItems(library, "series"));
        expect(groups.map((group) => group.status)).toEqual(["watching", "notStarted", "completed"]);
    });
});
