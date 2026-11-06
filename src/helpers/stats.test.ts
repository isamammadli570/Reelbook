import {describe, expect, it} from "vitest";
import {collectWatches, longestMarathon, monthlyMinutes, ratingDistribution, topPeople, splitWatchTime, summarize, topGenres, topSeries, watchTime, watchesInYear} from "@/helpers/stats";
import type {Library, LibraryItem} from "@/api/library.api";

const base = {posterPath: null, backdropPath: null, year: "2024", addedAt: "", updatedAt: "", isInWatchlist: false, isFavorite: false, isFollowing: false};

const dune: LibraryItem = {
    ...base,
    id: 1,
    mediaType: "movie",
    title: "Dune",
    genres: ["Sci-fi", "Drama"],
    runtime: 166,
    series: null,
    rating: 4.5,
    diary: [
        {id: "a", watchedAt: new Date(2026, 2, 12, 20).toISOString(), rating: 4},
        {id: "b", watchedAt: new Date(2025, 0, 3, 20).toISOString(), rating: 4.5},
    ],
    episodes: {},
};

const severance: LibraryItem = {
    ...base,
    id: 2,
    mediaType: "tv",
    title: "Severance",
    genres: ["Drama"],
    runtime: null,
    series: {seasons: [{number: 1, episodeCount: 9}], lastAired: {season: 1, episode: 9}, episodeRuntime: 50, network: null},
    rating: 3.5,
    diary: [],
    episodes: {
        "1:1": new Date(2026, 3, 14, 18).toISOString(),
        "1:2": new Date(2026, 3, 14, 19).toISOString(),
        "1:3": new Date(2026, 3, 14, 20).toISOString(),
        "1:4": new Date(2026, 4, 1, 20).toISOString(),
    },
};

const library: Library = {items: {"movie:1": dune, "tv:2": severance}};
const watches = collectWatches(library);

describe("collectWatches", () => {
    it("turns movie viewings and episodes into one newest-first list", () => {
        expect(watches).toHaveLength(6);
        expect(watches[0].episode).toEqual({season: 1, episode: 4});
        expect(watches.at(-1)?.item.title).toBe("Dune");
    });
});

describe("summarize", () => {
    it("adds up time, distinct titles and the average of their ratings", () => {
        expect(summarize(watches)).toEqual({minutes: 166 * 2 + 50 * 4, movies: 1, episodes: 4, series: 1, averageRating: 4});
    });

    it("narrows to one year", () => {
        expect(summarize(watchesInYear(watches, 2025))).toMatchObject({minutes: 166, movies: 1, episodes: 0});
    });
});

describe("monthlyMinutes", () => {
    it("buckets minutes by local month", () => {
        const months = monthlyMinutes(watches, 2026);
        expect(months[2]).toBe(166);
        expect(months[3]).toBe(150);
        expect(months[4]).toBe(50);
        expect(months[0]).toBe(0);
    });
});

describe("topGenres", () => {
    it("weights genres by watch time", () => {
        expect(topGenres(watches)).toEqual([
            // Drama: 332 (Dune) + 200 (Severance) of 864 genre-minutes; Sci-fi: 332.
            {name: "Drama", percent: 62},
            {name: "Sci-fi", percent: 38},
        ]);
    });
});

describe("series highlights", () => {
    it("finds the most watched series and the longest single-day run", () => {
        expect(topSeries(watches)).toMatchObject({episodes: 4, minutes: 200});
        expect(longestMarathon(watches)).toMatchObject({episodes: 3});
    });

    it("needs at least two episodes in a day for a marathon", () => {
        expect(longestMarathon(watchesInYear(watches, 2025))).toBeNull();
    });
});

describe("splitWatchTime", () => {
    it("splits minutes into months, days and hours", () => {
        expect(splitWatchTime(((30 + 4) * 24 + 15) * 60 + 59)).toEqual({months: 1, days: 4, hours: 15});
        expect(splitWatchTime(90)).toEqual({months: 0, days: 0, hours: 1});
    });
});

describe("watchTime", () => {
    it("rounds to hours and tenths of a day", () => {
        expect(watchTime(54_720)).toEqual({hours: 912, days: 38});
        expect(watchTime(90)).toEqual({hours: 2, days: 0.1});
    });
});

describe("ratingDistribution", () => {
    it("counts each rated title once, in half-star buckets", () => {
        const watches = collectWatches({items: {"movie:1": dune, "tv:2": severance}});
        const {counts, total} = ratingDistribution(watches);
        expect(total).toBe(2);
        expect(counts).toEqual([0, 0, 0, 0, 0, 0, 1, 0, 1, 0]);
    });
});

describe("topPeople", () => {
    const nolan = {id: 525, name: "Christopher Nolan", profilePath: null};
    const pugh = {id: 1373737, name: "Florence Pugh", profilePath: null};
    const film = (id: number, people: LibraryItem["people"]): LibraryItem => ({...dune, id, people, diary: [{id: `v${id}`, watchedAt: new Date(2026, 1, id).toISOString(), rating: null}]});

    it("counts each title once per person, and needs at least two", () => {
        const library: Library = {
            items: {
                "movie:1": {...film(1, {directors: [nolan], cast: [pugh]}), diary: [...film(1, undefined).diary, {id: "again", watchedAt: new Date(2026, 5, 1).toISOString(), rating: null}]},
                "movie:2": film(2, {directors: [nolan], cast: [pugh]}),
                "movie:3": film(3, {directors: [{id: 9, name: "Once Only", profilePath: null}], cast: []}),
                "tv:2": {...severance, people: {directors: [], cast: [pugh]}},
            },
        };
        const watches = collectWatches(library);
        expect(topPeople(watches, "directors")).toEqual([{person: nolan, titles: 2}]);
        expect(topPeople(watches, "cast")).toEqual([{person: pugh, titles: 3}]);
    });
});
