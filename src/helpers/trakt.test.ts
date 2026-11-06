import {describe, expect, it} from "vitest";
import type {LibraryItem, MediaSnapshot} from "@/api/library.api";
import {createLibrary} from "@/helpers/library";
import {createListsStore} from "@/helpers/lists";
import {collectTrakt, mergeTrakt, mergeTraktLists, mergeTraktTitle, summarizeTrakt, traktRating, type TraktExport, type TraktTitle} from "@/helpers/trakt";

const inception = {title: "Inception", year: 2010, ids: {trakt: 1, slug: "inception-2010", tmdb: 27205}};
const severance = {title: "Severance", year: 2022, ids: {trakt: 2, slug: "severance", tmdb: 95396}};
const dune = {title: "Dune: Part Two", year: 2024, ids: {trakt: 3, slug: "dune-part-two", tmdb: 693134}};
const noTmdb = {title: "Home Video", year: 1999, ids: {trakt: 4, slug: "home-video", tmdb: null}};

const data: TraktExport = {
    history: [
        {watched_at: "2024-01-01T21:10:00.000Z", movie: inception},
        {watched_at: "2025-03-03T19:00:00.000Z", movie: inception},
        {watched_at: "2023-05-05T20:00:00.000Z", movie: noTmdb},
    ],
    watchedShows: [{
        show: severance,
        seasons: [
            {number: 0, episodes: [{number: 1, last_watched_at: "2025-01-01T10:00:00.000Z"}]},
            {number: 1, episodes: [{number: 1, last_watched_at: "2025-02-01T20:00:00.000Z"}, {number: 2, last_watched_at: "2025-02-02T20:00:00.000Z"}]},
        ],
    }],
    ratings: [{rated_at: "2025-03-03T19:05:00.000Z", rating: 9, type: "movie", movie: inception}, {rated_at: "2025-02-03T19:05:00.000Z", rating: 8, type: "show", show: severance}],
    watchlist: [{listed_at: "2025-04-04T00:00:00.000Z", type: "movie", movie: dune}],
    lists: [{list: {name: "Mind benders", description: "Twisty", ids: {trakt: 10, slug: "mind-benders"}}, items: [
        {rank: 2, type: "movie", movie: inception},
        {rank: 1, type: "show", show: severance},
    ]}],
};

const snapshotOf = (title: TraktTitle): MediaSnapshot => ({id: title.tmdbId, mediaType: title.mediaType, title: title.title, posterPath: null, backdropPath: null, year: String(title.year), series: null});

describe("collectTrakt", () => {
    const {titles, lists, missing} = collectTrakt(data);
    const byKey = (key: string) => titles.find((title) => title.key === key);

    it("keys titles by their TMDB id and gathers plays, episodes, ratings and the watchlist", () => {
        expect(byKey("movie:27205")).toMatchObject({plays: ["2025-03-03T19:00:00.000Z", "2024-01-01T21:10:00.000Z"], rating: 4.5});
        expect(byKey("tv:95396")).toMatchObject({episodes: {"1:1": "2025-02-01T20:00:00.000Z", "1:2": "2025-02-02T20:00:00.000Z"}, rating: 4});
        expect(byKey("movie:693134")).toMatchObject({isInWatchlist: true, plays: []});
    });

    it("leaves out specials, and lists titles without a TMDB id as missing", () => {
        expect(byKey("tv:95396")?.episodes["0:1"]).toBeUndefined();
        expect(missing).toEqual([{title: "Home Video", year: 1999}]);
    });

    it("keeps a list's titles in Trakt's order", () => {
        expect(lists).toEqual([{id: "trakt-mind-benders", name: "Mind benders", description: "Twisty", keys: ["tv:95396", "movie:27205"]}]);
    });

    it("sums up what will come in", () => {
        const found = new Set(titles.map((title) => title.key));
        expect(summarizeTrakt(titles, lists, found)).toEqual({films: 1, viewings: 2, series: 1, episodes: 2, ratings: 2, watchlist: 1, lists: 1});
    });
});

describe("traktRating", () => {
    it("halves Trakt's 1–10 into stars", () => {
        expect(traktRating(10)).toBe(5);
        expect(traktRating(7)).toBe(3.5);
        expect(traktRating(1)).toBe(0.5);
        expect(traktRating(0)).toBeNull();
    });
});

describe("merging Trakt into the library", () => {
    const {titles, lists} = collectTrakt(data);
    const movie = titles.find((title) => title.key === "movie:27205") as TraktTitle;
    const show = titles.find((title) => title.key === "tv:95396") as TraktTitle;
    const blank = (title: TraktTitle): LibraryItem => ({
        ...snapshotOf(title), addedAt: "", updatedAt: "", isInWatchlist: false, isFavorite: false, isFollowing: false, rating: null, diary: [], episodes: {}, review: null,
    });

    it("adds each viewing at its own time, rates the latest, and skips days already logged", () => {
        const merged = mergeTraktTitle(blank(movie), movie);
        expect(merged.diary.map((entry) => [entry.watchedAt, entry.rating])).toEqual([["2025-03-03T19:00:00.000Z", 4.5], ["2024-01-01T21:10:00.000Z", null]]);
        expect(mergeTraktTitle(merged, movie).diary).toHaveLength(2);
    });

    it("marks episodes, follows the series and keeps dates already in the app", () => {
        const own = {...blank(show), episodes: {"1:1": "2024-12-24T20:00:00.000Z"}, rating: 2};
        const merged = mergeTraktTitle(own, show);
        expect(merged.episodes).toEqual({"1:1": "2024-12-24T20:00:00.000Z", "1:2": "2025-02-02T20:00:00.000Z"});
        expect(merged).toMatchObject({isFollowing: true, rating: 2, isInWatchlist: false});
    });

    it("writes found titles to the library and lists to the person's lists", () => {
        const found = titles.map((title) => ({title, snapshot: snapshotOf(title)}));
        const library = mergeTrakt(createLibrary(), found, new Date(2026, 10, 6));
        expect(Object.keys(library.items).sort()).toEqual(["movie:27205", "movie:693134", "tv:95396"]);
        const store = mergeTraktLists(createListsStore(), lists, new Map(found.map(({title, snapshot}) => [title.key, snapshot])), "2026-11-06T00:00:00.000Z");
        expect(store.lists["trakt-mind-benders"].entries.map((entry) => entry.title)).toEqual(["Severance", "Inception"]);
    });
});
