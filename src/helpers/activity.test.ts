import {describe, expect, it} from "vitest";
import {diaryMonths, diaryRows, recentTitles, watchRating} from "@/helpers/activity";
import type {LibraryItem} from "@/api/library.api";
import type {Watch} from "@/helpers/stats";

const item = (id: number, mediaType: "movie" | "tv", overrides: Partial<LibraryItem> = {}): LibraryItem => ({
    id,
    mediaType,
    title: `Title ${id}`,
    posterPath: null,
    backdropPath: null,
    year: "2024",
    series: null,
    addedAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    isInWatchlist: false,
    isFavorite: false,
    isFollowing: false,
    rating: null,
    diary: [],
    episodes: {},
    ...overrides,
});

const watch = (watched: LibraryItem, watchedAt: string): Watch => ({
    kind: watched.mediaType,
    item: watched,
    watchedAt,
    minutes: 0,
    episode: watched.mediaType === "tv" ? {season: 1, episode: 1} : null,
});

describe("recentTitles", () => {
    it("keeps each title once, at its newest watch", () => {
        const show = item(2, "tv");
        const film = item(1, "movie");
        const watches = [watch(show, "2026-11-06"), watch(show, "2026-11-05"), watch(film, "2026-11-04"), watch(item(3, "movie"), "2026-11-01")];
        expect(recentTitles(watches, 2).map((entry) => entry.item.id)).toEqual([2, 1]);
    });
});

describe("watchRating", () => {
    it("uses the stars of that viewing for movies and the overall rating for series", () => {
        const film = item(1, "movie", {rating: 5, diary: [{id: "a", watchedAt: "2026-11-06", rating: 5}, {id: "b", watchedAt: "2025-01-01", rating: 3}]});
        expect(watchRating(watch(film, "2025-01-01"))).toBe(3);
        expect(watchRating(watch(item(2, "tv", {rating: 4}), "2026-11-06"))).toBe(4);
    });
});

describe("diaryMonths", () => {
    it("groups consecutive watches by month", () => {
        const film = item(1, "movie");
        const months = diaryMonths([watch(film, "2026-11-06T20:00:00"), watch(film, "2026-11-01T20:00:00"), watch(film, "2026-10-30T20:00:00")]);
        expect(months.map((month) => [month.key, month.watches.length])).toEqual([["2026-11", 2], ["2026-10", 1]]);
    });
});

describe("diaryRows", () => {
    it("puts a heading before each month and shows the day once per day", () => {
        const film = item(1, "movie");
        const show = item(2, "tv");
        const rows = diaryRows([
            watch(film, "2026-11-06T21:00:00"),
            watch(show, "2026-11-06T20:00:00"),
            watch(show, "2026-11-01T20:00:00"),
            watch(film, "2026-10-30T20:00:00"),
        ]);
        expect(rows.map((row) => (row.kind === "month" ? row.month : row.isFirstOfDay))).toEqual(["2026-11", true, false, true, "2026-10", true]);
        expect(new Set(rows.map((row) => row.key)).size).toBe(rows.length);
    });
});
