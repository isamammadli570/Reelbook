import {describe, expect, it} from "vitest";
import type {LibraryItem} from "@/api/library.api";
import {cleanUserQuery, eventsOf, friendsOnTitle, libraryFromRows, listsFromRows, ownerEyebrow, relativeTime, type ActivityEvent} from "@/helpers/social";

const base: LibraryItem = {
    id: 27205,
    mediaType: "movie",
    title: "Inception",
    posterPath: "/p.jpg",
    backdropPath: null,
    year: "2010",
    series: null,
    addedAt: "",
    updatedAt: "",
    isInWatchlist: false,
    isFavorite: false,
    isFollowing: false,
    rating: 4.5,
    diary: [],
    episodes: {},
    review: null,
};

describe("eventsOf", () => {
    it("makes one event per film viewing, with the stars given then", () => {
        const events = eventsOf({
            ...base,
            diary: [
                {id: "b", watchedAt: "2026-03-03T20:00:00.000Z", rating: 4.5},
                {id: "a", watchedAt: "2024-01-01T20:00:00.000Z", rating: 4},
            ],
        });
        expect(events.map((event) => [event.eventKey, event.kind, event.rating])).toEqual([["watch:b", "watch", 4.5], ["watch:a", "watch", 4]]);
        expect(events[0]).toMatchObject({itemKey: "movie:27205", title: "Inception", posterPath: "/p.jpg", happenedAt: "2026-03-03T20:00:00.000Z"});
    });

    it("adds the review, and nothing for a title only on the watchlist", () => {
        expect(eventsOf({...base, isInWatchlist: true, rating: null})).toEqual([]);
        const [review] = eventsOf({...base, review: {text: "Dreams.", updatedAt: "2026-04-04T10:00:00.000Z"}});
        expect(review).toMatchObject({eventKey: "review:movie:27205", kind: "review", review: "Dreams.", rating: 4.5});
    });

    it("groups a series' episodes by day, with the day's count and last time", () => {
        const day1a = new Date(2026, 3, 14, 18).toISOString();
        const day1b = new Date(2026, 3, 14, 21).toISOString();
        const day2 = new Date(2026, 4, 1, 20).toISOString();
        const events = eventsOf({...base, id: 95396, mediaType: "tv", title: "Severance", rating: 5, episodes: {"1:1": day1a, "1:2": day1b, "1:3": day2}});
        expect(events).toHaveLength(2);
        expect(events.find((event) => event.eventKey === "episodes:tv:95396:2026-04-14")).toMatchObject({episodeCount: 2, happenedAt: day1b, rating: 5});
        expect(events.find((event) => event.eventKey === "episodes:tv:95396:2026-05-01")).toMatchObject({episodeCount: 1});
    });
});

describe("cleanUserQuery", () => {
    it("drops the @ and anything a filter could misread", () => {
        expect(cleanUserQuery(" @isa_m ")).toBe("isa_m");
        expect(cleanUserQuery("isa,(or)*%")).toBe("isaor");
        expect(cleanUserQuery("İsa Məmmədli")).toBe("İsa Məmmədli");
    });
});

describe("relativeTime", () => {
    const now = new Date("2026-11-06T12:00:00.000Z");
    it("counts up from minutes to weeks, then hands over to the date", () => {
        expect(relativeTime("2026-11-06T11:59:40.000Z", now)).toEqual({unit: "now", count: 0});
        expect(relativeTime("2026-11-06T11:15:00.000Z", now)).toEqual({unit: "minutes", count: 45});
        expect(relativeTime("2026-11-06T07:00:00.000Z", now)).toEqual({unit: "hours", count: 5});
        expect(relativeTime("2026-11-03T12:00:00.000Z", now)).toEqual({unit: "days", count: 3});
        expect(relativeTime("2026-10-20T12:00:00.000Z", now)).toEqual({unit: "weeks", count: 2});
        expect(relativeTime("2026-08-01T12:00:00.000Z", now)).toEqual({unit: "date", count: 0});
        expect(relativeTime("2026-11-07T12:00:00.000Z", now)).toEqual({unit: "now", count: 0});
    });
});

describe("friendsOnTitle", () => {
    const event = (userId: string, overrides: Partial<ActivityEvent>): ActivityEvent & {userId: string} => ({
        userId,
        eventKey: "watch:x",
        itemKey: "movie:1",
        kind: "watch",
        mediaType: "movie",
        mediaId: 1,
        title: "Inception",
        posterPath: null,
        year: "2010",
        rating: null,
        review: null,
        episodeCount: null,
        happenedAt: "2026-01-01T00:00:00.000Z",
        ...overrides,
    });

    it("makes one entry per person, newest first", () => {
        const result = friendsOnTitle([
            event("a", {happenedAt: "2026-01-01T00:00:00.000Z"}),
            event("b", {happenedAt: "2026-03-01T00:00:00.000Z"}),
            event("a", {happenedAt: "2026-02-01T00:00:00.000Z"}),
        ]);
        expect(result.map((friend) => friend.userId)).toEqual(["b", "a"]);
        expect(result[1].happenedAt).toBe("2026-02-01T00:00:00.000Z");
    });

    it("takes the newest stars and the review, and never lets an older viewing override a newer one", () => {
        const [friend] = friendsOnTitle([
            event("a", {kind: "watch", rating: 3, happenedAt: "2026-01-01T00:00:00.000Z"}),
            event("a", {kind: "watch", rating: 4.5, happenedAt: "2026-03-01T00:00:00.000Z"}),
            event("a", {kind: "review", rating: null, review: "Dreams.", happenedAt: "2026-02-01T00:00:00.000Z"}),
        ]);
        expect(friend).toMatchObject({rating: 4.5, review: "Dreams."});
    });

    it("is empty when nobody did anything", () => {
        expect(friendsOnTitle([])).toEqual([]);
    });
});

describe("libraryFromRows", () => {
    it("keeps live titles under their keys and leaves deleted ones out", () => {
        const library = libraryFromRows([
            {key: "movie:27205", data: base},
            {key: "movie:1", data: {deleted: true}},
        ]);
        expect(Object.keys(library.items)).toEqual(["movie:27205"]);
        expect(library.items["movie:27205"]?.title).toBe("Inception");
    });
});

describe("listsFromRows", () => {
    it("leaves deleted lists out", () => {
        const list = {id: "a", name: "Noir", description: "", entries: [], createdAt: "", updatedAt: ""};
        expect(listsFromRows([{key: "a", data: list}, {key: "b", data: {deleted: true}}])).toEqual({lists: {a: list}});
    });
});

describe("ownerEyebrow", () => {
    it("names the owner only on someone else's pages", () => {
        expect(ownerEyebrow(null, true, "4 titles")).toBe("4 titles");
        expect(ownerEyebrow("isa", true, "4 titles")).toBe("4 titles");
        expect(ownerEyebrow("isa", false, "4 titles")).toBe("@isa  ·  4 titles");
    });
});
