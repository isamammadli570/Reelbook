import {describe, expect, it} from "vitest";
import {collectionParts, movieCertification, pickLogo, seriesCast, seriesCertification, watchedInCollection} from "@/helpers/titleExtras";
import type {TitleImage} from "@/api/titleExtras.api";

describe("movieCertification", () => {
    const dates = {
        results: [
            {iso_3166_1: "US", release_dates: [{certification: "", type: 1}, {certification: "R", type: 3}, {certification: "NR", type: 5}]},
            {iso_3166_1: "DE", release_dates: [{certification: "18", type: 5}]},
        ],
    };

    it("takes the cinema certificate in the first country that has one", () => {
        expect(movieCertification(dates, ["AZ", "US"])).toBe("R");
        expect(movieCertification(dates, ["DE", "US"])).toBe("18");
        expect(movieCertification(dates, ["AZ"])).toBeNull();
        expect(movieCertification(undefined, ["US"])).toBeNull();
    });
});

describe("seriesCertification", () => {
    it("takes the first country with a rating and skips blank ones", () => {
        const ratings = {results: [{iso_3166_1: "RU", rating: " "}, {iso_3166_1: "US", rating: "TV-MA"}]};
        expect(seriesCertification(ratings, ["RU", "US"])).toBe("TV-MA");
    });
});

describe("pickLogo", () => {
    const logo = (iso: string | null, vote: number, aspect = 2.5): TitleImage => ({file_path: `/${iso}-${vote}.png`, iso_639_1: iso, aspect_ratio: aspect, vote_average: vote});

    it("prefers the app language, then English, then a logo without text, best voted first", () => {
        const logos = [logo("en", 5), logo("en", 7), logo(null, 9), logo("ru", 3)];
        expect(pickLogo(logos, "ru")?.file_path).toBe("/ru-3.png");
        expect(pickLogo(logos, "az")?.file_path).toBe("/en-7.png");
        expect(pickLogo([logo(null, 2)], "az")?.file_path).toBe("/null-2.png");
    });

    it("skips logos too tall to sit beside the poster", () => {
        expect(pickLogo([logo("en", 9, 0.8)], "en")).toBeNull();
    });
});

describe("seriesCast", () => {
    it("shows each person's main character and episode count", () => {
        const chips = seriesCast({
            cast: [{id: 1, name: "Peter", profile_path: null, total_episode_count: 67, roles: [{character: "Guard", episode_count: 1}, {character: "Tyrion", episode_count: 67}]}],
        }, (count) => `${count} ep`);
        expect(chips).toEqual([{id: 1, name: "Peter", profile_path: null, character: "Tyrion · 67 ep"}]);
    });
});

describe("collectionParts and watchedInCollection", () => {
    it("orders films by release with undated ones last, and counts the watched", () => {
        const parts = [{id: 3, release_date: ""}, {id: 2, release_date: "2004-06-04"}, {id: 1, release_date: "2001-11-16"}];
        expect(collectionParts(parts).map((part) => part.id)).toEqual([1, 2, 3]);
        expect(watchedInCollection(parts, (id) => id !== 3)).toBe(2);
    });
});
