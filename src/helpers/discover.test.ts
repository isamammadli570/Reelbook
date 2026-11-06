import {describe, expect, it} from "vitest";
import {activeFilterCount, decadeSpan, discoverParams, EMPTY_FILTERS, genreParamsFor, genresFor, mediaTypesFor, toggleDecade, toggleValue} from "@/helpers/discover";
import {GENRES} from "@/constants/genres";

const byKey = (key: string) => {
    const genre = GENRES.find((tile) => tile.key === key);
    if (!genre) throw new Error(`no ${key} tile`);
    return genre;
};

const TODAY = "2026-11-06";

describe("genreParamsFor", () => {
    it("asks by genre, or by keyword where series lack the genre", () => {
        expect(genreParamsFor(byKey("scifi"), "tv")).toEqual({with_genres: 10765});
        expect(genreParamsFor(byKey("horror"), "movie")).toEqual({with_genres: 27});
        expect(genreParamsFor(byKey("horror"), "tv")).toEqual({with_keywords: 315058});
    });
});

describe("genresFor and mediaTypesFor", () => {
    it("offers every tile for series now that horror and romance use keywords", () => {
        expect(genresFor(GENRES, "tv")).toHaveLength(GENRES.length);
        expect(mediaTypesFor(byKey("romance"), "all")).toEqual(["movie", "tv"]);
        expect(mediaTypesFor(byKey("drama"), "movie")).toEqual(["movie"]);
    });

    it("has a unique key and a movie id on every tile", () => {
        expect(new Set(GENRES.map((genre) => genre.key)).size).toBe(GENRES.length);
        GENRES.forEach((genre) => expect(genre.movieId).toBeGreaterThan(0));
    });
});

describe("discoverParams", () => {
    it("asks for popular titles with enough votes by default", () => {
        expect(discoverParams("movie", {genre: null, filters: EMPTY_FILTERS, region: "US", today: TODAY})).toEqual({sort_by: "popularity.desc", "vote_count.gte": 50});
    });

    it("turns every filter into TMDB's names, with dates fitting the kind of title", () => {
        const params = discoverParams("tv", {
            genre: byKey("drama"),
            filters: {providerIds: [8], languages: ["ko"], decades: [2010], minRating: 7, sort: "newest"},
            region: "TR",
            today: TODAY,
        });
        expect(params).toEqual({
            with_genres: 18,
            sort_by: "first_air_date.desc",
            "vote_count.gte": 50,
            "first_air_date.gte": "2010-01-01",
            "first_air_date.lte": "2019-12-31",
            "vote_average.gte": 7,
            with_original_language: "ko",
            with_watch_providers: "8",
            watch_region: "TR",
            with_watch_monetization_types: "flatrate|free|ads",
        });
    });

    it("keeps newest to titles already out, needs more votes to sort by rating, and reads decade 0 as before 1990", () => {
        expect(discoverParams("movie", {genre: null, filters: {...EMPTY_FILTERS, sort: "newest"}, region: "US", today: TODAY})).toMatchObject({"primary_release_date.lte": TODAY});
        expect(discoverParams("movie", {genre: null, filters: {...EMPTY_FILTERS, sort: "rating"}, region: "US", today: TODAY})).toMatchObject({"vote_count.gte": 300});
        const older = discoverParams("movie", {genre: null, filters: {...EMPTY_FILTERS, decades: [0]}, region: "US", today: TODAY});
        expect(older).toMatchObject({"primary_release_date.lte": "1989-12-31"});
        expect(older).not.toHaveProperty("primary_release_date.gte");
    });

    it("joins several languages and services with TMDB's 'either', and spans a run of decades", () => {
        const params = discoverParams("movie", {
            genre: null,
            filters: {...EMPTY_FILTERS, languages: ["tr", "ja"], providerIds: [8, 337], decades: [2020, 2010, 2000]},
            region: "US",
            today: TODAY,
        });
        expect(params).toMatchObject({
            with_original_language: "tr|ja",
            with_watch_providers: "8|337",
            "primary_release_date.gte": "2000-01-01",
            "primary_release_date.lte": "2029-12-31",
        });
    });
});

describe("toggleValue", () => {
    it("adds a value or takes it out", () => {
        expect(toggleValue(["tr"], "ja")).toEqual(["tr", "ja"]);
        expect(toggleValue(["tr", "ja"], "tr")).toEqual(["ja"]);
    });
});

describe("toggleDecade and decadeSpan", () => {
    it("fills the gap between two decades, so the run stays unbroken", () => {
        expect(toggleDecade([], 2000)).toEqual([2000]);
        expect(toggleDecade([2000], 2020)).toEqual([2020, 2010, 2000]);
    });

    it("lets go of an end, and narrows to a decade tapped inside the run", () => {
        expect(toggleDecade([2020, 2010, 2000], 2020)).toEqual([2010, 2000]);
        expect(toggleDecade([2020, 2010, 2000], 2000)).toEqual([2020, 2010]);
        expect(toggleDecade([2020, 2010, 2000], 2010)).toEqual([2010]);
        expect(toggleDecade([2010], 2010)).toEqual([]);
    });

    it("gives the years a run covers, open-ended before 1990", () => {
        expect(decadeSpan([])).toBeNull();
        expect(decadeSpan([2010, 2000])).toEqual({from: 2000, to: 2019});
        expect(decadeSpan([1990, 0])).toEqual({from: null, to: 1999});
    });
});

describe("activeFilterCount", () => {
    it("counts filters set away from the defaults", () => {
        expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
        expect(activeFilterCount({...EMPTY_FILTERS, languages: ["tr", "ja"], sort: "rating"})).toBe(2);
    });
});
