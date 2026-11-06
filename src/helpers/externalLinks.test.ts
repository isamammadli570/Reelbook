import {describe, expect, it} from "vitest";
import {externalLinks, isImdbId, parseImdbId} from "@/helpers/externalLinks";

describe("isImdbId and parseImdbId", () => {
    it("knows an IMDb title id", () => {
        expect(isImdbId("tt0903747")).toBe(true);
        expect(isImdbId("nm0000123")).toBe(false);
        expect(isImdbId("")).toBe(false);
        expect(isImdbId(null)).toBe(false);
    });

    it("finds the id inside an IMDb address", () => {
        expect(parseImdbId("https://www.imdb.com/title/tt0903747/?ref_=nv")).toBe("tt0903747");
        expect(parseImdbId("tt1375666")).toBe("tt1375666");
        expect(parseImdbId("letterboxd.com/film/inception")).toBeNull();
    });
});

describe("externalLinks", () => {
    it("links a film everywhere it has an id, in order", () => {
        const links = externalLinks({
            mediaType: "movie",
            tmdbId: 27205,
            externalIds: {imdb_id: "tt1375666", wikidata_id: "Q25188"},
            homepage: "https://www.warnerbros.com/movies/inception",
            language: "az",
        });
        expect(links).toEqual([
            {site: "imdb", url: "https://www.imdb.com/title/tt1375666/"},
            {site: "letterboxd", url: "https://letterboxd.com/tmdb/27205/"},
            {site: "tmdb", url: "https://www.themoviedb.org/movie/27205"},
            {site: "wikipedia", url: "https://www.wikidata.org/wiki/Special:GoToLinkedPage/enwiki/Q25188"},
            {site: "homepage", url: "https://www.warnerbros.com/movies/inception"},
        ]);
    });

    it("leaves out Letterboxd for series and whatever has no id", () => {
        const links = externalLinks({mediaType: "tv", tmdbId: 1396, externalIds: {imdb_id: "", wikidata_id: null}, homepage: "", language: "ru"});
        expect(links).toEqual([{site: "tmdb", url: "https://www.themoviedb.org/tv/1396"}]);
    });

    it("reads the Russian Wikipedia in Russian", () => {
        const links = externalLinks({mediaType: "tv", tmdbId: 1396, externalIds: {wikidata_id: "Q1079"}, homepage: null, language: "ru"});
        expect(links.find((link) => link.site === "wikipedia")?.url).toContain("/ruwiki/Q1079");
    });
});
