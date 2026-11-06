import {describe, expect, it} from "vitest";
import type {LibraryItem, MediaSnapshot} from "@/api/library.api";
import {createLibrary, itemKey} from "@/helpers/library";
import {createListsStore} from "@/helpers/lists";
import {
    collectLetterboxdLists,
    listFilmsToFind,
    mergeLetterboxdLists,
    parseLetterboxdList,
    collectLetterboxd,
    csvRecords,
    letterboxdFileOf,
    mergeLetterboxd,
    mergeLetterboxdFilm,
    parseCsv,
    parseRating,
    pickMatch,
    plainReview,
    summarizeLetterboxd,
    type LetterboxdFilm,
} from "@/helpers/letterboxd";

const NOW = new Date(2026, 10, 6, 15, 0);

const snapshot: MediaSnapshot = {id: 27205, mediaType: "movie", title: "Inception", posterPath: null, backdropPath: null, year: "2010", series: null};

const blankItem = (overrides: Partial<LibraryItem> = {}): LibraryItem => ({
    ...snapshot,
    addedAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    isInWatchlist: false,
    isFavorite: false,
    isFollowing: false,
    rating: null,
    diary: [],
    episodes: {},
    review: null,
    ...overrides,
});

const film = (overrides: Partial<LetterboxdFilm> = {}): LetterboxdFilm => ({
    key: "inception|2010",
    name: "Inception",
    year: 2010,
    viewings: [],
    watchedOn: null,
    rating: null,
    review: null,
    isInWatchlist: false,
    isLiked: false,
    ...overrides,
});

describe("parseCsv", () => {
    it("reads quoted fields with commas, doubled quotes and line breaks", () => {
        const text = "﻿Name,Review\r\n\"Crash, the film\",\"He said \"\"no\"\"\nthen left\"\r\nUp,fine\n";
        expect(parseCsv(text)).toEqual([["Name", "Review"], ["Crash, the film", "He said \"no\"\nthen left"], ["Up", "fine"]]);
    });

    it("keys rows by column name, whatever their order", () => {
        expect(csvRecords("Year,Name\n1999,The Matrix")).toEqual([{year: "1999", name: "The Matrix"}]);
    });
});

describe("letterboxdFileOf", () => {
    it("finds the export's files, inside a folder or not, and skips deleted copies", () => {
        expect(letterboxdFileOf("diary.csv")).toBe("diary.csv");
        expect(letterboxdFileOf("letterboxd-isa-2026/ratings.csv")).toBe("ratings.csv");
        expect(letterboxdFileOf("likes/films.csv")).toBe("likes/films.csv");
        expect(letterboxdFileOf("deleted/diary.csv")).toBeNull();
        expect(letterboxdFileOf("lists/best-of.csv")).toBeNull();
    });
});

describe("parseRating and plainReview", () => {
    it("keeps half stars from 0.5 to 5", () => {
        expect(parseRating("4.5")).toBe(4.5);
        expect(parseRating("")).toBeNull();
        expect(parseRating("0")).toBeNull();
        expect(parseRating("7")).toBeNull();
    });

    it("drops Letterboxd's markup from a review", () => {
        expect(plainReview("<i>Wow</i>.<br />Loved it &amp; more")).toBe("Wow.\nLoved it & more");
    });
});

describe("collectLetterboxd", () => {
    const files = {
        "diary.csv": "Date,Name,Year,Letterboxd URI,Rating,Rewatch,Tags,Watched Date\n2024-01-02,Inception,2010,https://boxd.it/a,4,,,2024-01-01\n2025-03-04,Inception,2010,https://boxd.it/b,4.5,Yes,,2025-03-03",
        "ratings.csv": "Date,Name,Year,Letterboxd URI,Rating\n2025-03-04,Inception,2010,https://boxd.it/x,4.5\n2023-05-05,Heat,1995,https://boxd.it/y,5",
        "watched.csv": "Date,Name,Year,Letterboxd URI\n2020-06-07,Heat,1995,https://boxd.it/y",
        "watchlist.csv": "Date,Name,Year,Letterboxd URI\n2024-02-02,Dune: Part Two,2024,https://boxd.it/z",
        "reviews.csv": "Date,Name,Year,Letterboxd URI,Rating,Rewatch,Review,Tags,Watched Date\n2025-03-04,Inception,2010,https://boxd.it/b,4.5,Yes,\"Better, again.\",,2025-03-03",
        "likes/films.csv": "Date,Name,Year,Letterboxd URI\n2024-01-02,Heat,1995,https://boxd.it/y",
        "deleted/diary.csv": "Date,Name,Year,Letterboxd URI,Rating,Rewatch,Tags,Watched Date\n2024-01-02,Cats,2019,https://boxd.it/c,,,,2024-01-01",
    };
    const films = collectLetterboxd(files);
    const byName = (name: string) => films.find((entry) => entry.name === name);

    it("gathers each film's viewings, rating, review, watchlist and like", () => {
        expect(films).toHaveLength(3);
        expect(byName("Inception")).toMatchObject({
            year: 2010,
            viewings: [{date: "2025-03-03", rating: 4.5}, {date: "2024-01-01", rating: 4}],
            rating: 4.5,
            review: {text: "Better, again.", date: "2025-03-03"},
        });
        expect(byName("Heat")).toMatchObject({watchedOn: "2020-06-07", rating: 5, isLiked: true, viewings: []});
        expect(byName("Dune: Part Two")).toMatchObject({isInWatchlist: true, watchedOn: null});
    });

    it("sums up what the import brings", () => {
        expect(summarizeLetterboxd(films)).toEqual({films: 3, viewings: 3, ratings: 2, reviews: 1, watchlist: 1, liked: 1});
    });
});

describe("pickMatch", () => {
    const candidates = [
        {id: 1, title: "Dune", release_date: "1984-12-14"},
        {id: 2, title: "Dune", release_date: "2021-09-15"},
        {id: 3, title: "Amélie", original_title: "Le Fabuleux Destin d'Amélie Poulain", release_date: "2001-04-25"},
    ];

    it("takes the film of the same year, ignoring accents and case", () => {
        expect(pickMatch(candidates, "Dune", 2021)?.id).toBe(2);
        expect(pickMatch(candidates, "amelie", 2001)?.id).toBe(3);
    });

    it("allows a year off by one only for the same title", () => {
        expect(pickMatch(candidates, "Dune", 2020)?.id).toBe(2);
        expect(pickMatch(candidates, "Something else", 2020)).toBeNull();
        expect(pickMatch(candidates, "Dune", 1999)).toBeNull();
    });
});

describe("mergeLetterboxdFilm", () => {
    it("adds viewings in the evening of their day, rates the latest and takes the film off the watchlist", () => {
        const merged = mergeLetterboxdFilm(blankItem({isInWatchlist: true}), film({viewings: [{date: "2024-01-01", rating: null}], rating: 4}), NOW);
        expect(merged.diary).toHaveLength(1);
        expect(new Date(merged.diary[0].watchedAt).getHours()).toBe(20);
        expect(merged.diary[0].rating).toBe(4);
        expect(merged).toMatchObject({rating: 4, isInWatchlist: false});
    });

    it("changes nothing when the same file is imported twice", () => {
        const once = mergeLetterboxdFilm(blankItem(), film({viewings: [{date: "2024-01-01", rating: 4}]}), NOW);
        const twice = mergeLetterboxdFilm(once, film({viewings: [{date: "2024-01-01", rating: 4}]}), NOW);
        expect(twice.diary).toEqual(once.diary);
    });

    it("keeps the person's own rating and review over Letterboxd's", () => {
        const own = blankItem({rating: 2, review: {text: "Mine", updatedAt: NOW.toISOString()}});
        const merged = mergeLetterboxdFilm(own, film({rating: 5, review: {text: "Theirs", date: "2020-01-01"}}), NOW);
        expect(merged.rating).toBe(2);
        expect(merged.review?.text).toBe("Mine");
    });

    it("logs a film marked watched without a diary entry once, on the day it was marked", () => {
        const merged = mergeLetterboxdFilm(blankItem(), film({watchedOn: "2020-06-07", isLiked: true}), NOW);
        expect(merged.diary).toHaveLength(1);
        expect(merged.isFavorite).toBe(true);
        expect(mergeLetterboxdFilm(merged, film({watchedOn: "2021-01-01"}), NOW).diary).toHaveLength(1);
    });

    it("leaves a watchlist-only film on the watchlist", () => {
        expect(mergeLetterboxdFilm(blankItem(), film({isInWatchlist: true}), NOW)).toMatchObject({isInWatchlist: true, diary: []});
    });
});

describe("mergeLetterboxd", () => {
    it("writes every matched film into the library", () => {
        const library = mergeLetterboxd(createLibrary(), [{film: film({rating: 3, watchedOn: "2022-02-02"}), snapshot}], NOW);
        expect(library.items[itemKey("movie", 27205)]).toMatchObject({title: "Inception", rating: 3});
    });
});

describe("Letterboxd lists", () => {
    const listCsv = [
        "Letterboxd list export v7",
        "Date,Name,Tags,URL,Description",
        "2024-05-01,Heist favourites,,https://letterboxd.com/me/list/heist-favourites/,\"Best <i>heists</i>\"",
        "",
        "Position,Name,Year,URL,Description",
        "1,Heat,1995,https://letterboxd.com/film/heat-1995/,",
        "2,Inception,2010,https://letterboxd.com/film/inception/,",
        "3,Nowhere Film,2001,https://letterboxd.com/film/nowhere/,",
    ].join("\n");

    it("reads a list's name, description and films in order", () => {
        expect(parseLetterboxdList("lists/heist-favourites.csv", listCsv)).toEqual({
            id: "letterboxd-heist-favourites",
            name: "Heist favourites",
            description: "Best heists",
            films: [
                {key: "heat|1995", name: "Heat", year: 1995},
                {key: "inception|2010", name: "Inception", year: 2010},
                {key: "nowhere film|2001", name: "Nowhere Film", year: 2001},
            ],
        });
    });

    it("only reads files in the lists folder", () => {
        expect(collectLetterboxdLists({"lists/heist-favourites.csv": listCsv, "diary.csv": listCsv, "deleted/lists/old.csv": listCsv})).toHaveLength(1);
    });

    it("asks TMDB only for list films not already being found", () => {
        const lists = collectLetterboxdLists({"lists/heist-favourites.csv": listCsv});
        expect(listFilmsToFind(lists, [film()]).map((entry) => entry.name)).toEqual(["Heat", "Nowhere Film"]);
    });

    const heat: MediaSnapshot = {...snapshot, id: 949, title: "Heat", year: "1995"};
    const found = new Map([["heat|1995", heat], ["inception|2010", snapshot]]);
    const lists = collectLetterboxdLists({"lists/heist-favourites.csv": listCsv});

    it("adds a list with the films found, in Letterboxd's order", () => {
        const store = mergeLetterboxdLists(createListsStore(), lists, found, NOW.toISOString());
        expect(store.lists["letterboxd-heist-favourites"].entries.map((entry) => entry.title)).toEqual(["Heat", "Inception"]);
    });

    it("updates the same list on a second import, keeping what was changed in the app", () => {
        const once = mergeLetterboxdLists(createListsStore(), lists, new Map([["heat|1995", heat]]), NOW.toISOString());
        const renamed = {...once, lists: {...once.lists, "letterboxd-heist-favourites": {...once.lists["letterboxd-heist-favourites"], name: "My heists"}}};
        const twice = mergeLetterboxdLists(renamed, lists, found, NOW.toISOString());
        expect(Object.keys(twice.lists)).toHaveLength(1);
        expect(twice.lists["letterboxd-heist-favourites"]).toMatchObject({name: "My heists"});
        expect(twice.lists["letterboxd-heist-favourites"].entries.map((entry) => entry.title)).toEqual(["Heat", "Inception"]);
    });

    it("does not touch the library for films known only from a list", () => {
        const onlyListed = {...film(), key: "heat|1995", name: "Heat", year: 1995};
        expect(mergeLetterboxd(createLibrary(), [{film: onlyListed, snapshot: heat}], NOW)).toEqual(createLibrary());
    });
});
