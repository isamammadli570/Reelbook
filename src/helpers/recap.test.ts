import {describe, expect, it} from "vitest";
import {buildRecap, recapYears} from "@/helpers/recap";
import type {Watch} from "@/helpers/stats";
import type {LibraryItem} from "@/api/library.api";

const item = (id: number, overrides: Partial<LibraryItem> = {}): LibraryItem => ({
    id,
    mediaType: "movie",
    title: `Film ${id}`,
    posterPath: `/p${id}.jpg`,
    backdropPath: null,
    year: "2026",
    addedAt: "",
    updatedAt: "",
    isInWatchlist: false,
    isFavorite: false,
    isFollowing: false,
    genres: ["Drama"],
    runtime: 120,
    series: null,
    rating: null,
    diary: [],
    episodes: {},
    review: null,
    ...overrides,
});

const watch = (film: LibraryItem, date: Date, minutes = 120): Watch => ({kind: film.mediaType, item: film, watchedAt: date.toISOString(), minutes, episode: null});

describe("buildRecap", () => {
    it("is null for a year with nothing watched", () => {
        expect(buildRecap([watch(item(1), new Date(2025, 5, 1))], 2026)).toBeNull();
    });

    it("sums the year only and finds the busiest month", () => {
        const recap = buildRecap(
            [watch(item(1), new Date(2026, 2, 1), 120), watch(item(2), new Date(2026, 2, 9), 180), watch(item(3), new Date(2026, 6, 1), 60), watch(item(4), new Date(2025, 0, 1), 999)],
            2026,
        );
        expect(recap).toMatchObject({year: 2026, hours: 6, movies: 3, busiestMonth: 2, genres: ["Drama"]});
    });

    it("shows the best-rated titles first, one poster each, skipping titles without one", () => {
        const recap = buildRecap(
            [
                watch(item(1, {rating: 3}), new Date(2026, 0, 1)),
                watch(item(2, {rating: 5}), new Date(2026, 1, 1)),
                watch(item(3, {rating: 5, posterPath: null}), new Date(2026, 2, 1)),
                watch(item(4, {rating: 4}), new Date(2026, 3, 1)),
                watch(item(4, {rating: 4}), new Date(2026, 4, 1)),
                watch(item(5, {rating: null}), new Date(2026, 5, 1)),
            ],
            2026,
        );
        expect(recap?.titles.map((title) => title.id)).toEqual([2, 4, 1]);
    });

    it("has no busiest month when runtimes are unknown", () => {
        expect(buildRecap([watch(item(1), new Date(2026, 0, 1), 0)], 2026)?.busiestMonth).toBeNull();
    });
});

describe("recapYears", () => {
    it("lists each year with viewings, newest first", () => {
        const years = recapYears([watch(item(1), new Date(2024, 0, 1)), watch(item(2), new Date(2026, 0, 1)), watch(item(3), new Date(2026, 5, 1))]);
        expect(years).toEqual([2026, 2024]);
    });
});
