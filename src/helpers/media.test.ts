import {describe, expect, it} from "vitest";
import {imageUrl, mediaTitle, mediaYear} from "@/helpers/media";
import {IMAGE_SIZE} from "@/constants/other";

describe("mediaTitle", () => {
    it("uses the movie title or the series name", () => {
        expect(mediaTitle({title: "Dune"})).toBe("Dune");
        expect(mediaTitle({name: "Severance"})).toBe("Severance");
        expect(mediaTitle({})).toBe("");
    });
});

describe("mediaYear", () => {
    it("takes the year from either date and ignores empty dates", () => {
        expect(mediaYear({release_date: "2024-02-27"})).toBe("2024");
        expect(mediaYear({first_air_date: "2022-02-17"})).toBe("2022");
        expect(mediaYear({release_date: "", first_air_date: "2019-01-01"})).toBe("2019");
        expect(mediaYear({})).toBe("");
    });
});

describe("imageUrl", () => {
    it("builds a sized TMDB url and returns null without a path", () => {
        expect(imageUrl("/a.jpg", IMAGE_SIZE.POSTER)).toBe("https://image.tmdb.org/t/p/w342/a.jpg");
        expect(imageUrl(null, IMAGE_SIZE.POSTER)).toBeNull();
    });
});
