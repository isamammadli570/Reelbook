import {describe, expect, it} from "vitest";
import {genreIdFor} from "@/helpers/discover";
import {GENRES} from "@/constants/genres";

describe("genreIdFor", () => {
    it("uses the movie id for movies and the series id for series, which TMDB numbers differently", () => {
        const genre = GENRES[0];
        expect(genreIdFor(genre, "movie")).toBe(genre.movieId);
        expect(genreIdFor(genre, "tv")).toBe(genre.tvId);
    });

    it("has an id for both kinds on every tile", () => {
        GENRES.forEach((genre) => {
            expect(genre.movieId).toBeGreaterThan(0);
            expect(genre.tvId).toBeGreaterThan(0);
        });
    });
});
