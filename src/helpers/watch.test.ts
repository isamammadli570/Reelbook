import {describe, expect, it} from "vitest";
import {pickTrailer, providerGroups, regionOffers} from "@/helpers/watch";
import type {Provider, Video} from "@/api/watch.api";

const video = (overrides: Partial<Video>): Video => ({
    key: "k",
    name: "Video",
    site: "YouTube",
    type: "Trailer",
    official: true,
    iso_639_1: "en",
    published_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
});

const provider = (id: number, priority: number): Provider => ({provider_id: id, provider_name: `P${id}`, logo_path: null, display_priority: priority});

describe("pickTrailer", () => {
    it("prefers YouTube trailers in the app language, then official, then newest", () => {
        const videos = [
            video({key: "vimeo", site: "Vimeo"}),
            video({key: "teaser", type: "Teaser", iso_639_1: "ru"}),
            video({key: "featurette", type: "Featurette", iso_639_1: "ru"}),
            video({key: "en-old", published_at: "2023-01-01T00:00:00.000Z"}),
            video({key: "en-new"}),
            video({key: "ru", iso_639_1: "ru", official: false}),
        ];
        expect(pickTrailer(videos, "ru")?.key).toBe("ru");
        expect(pickTrailer(videos, "en")?.key).toBe("en-new");
    });

    it("falls back to a teaser and returns null without either", () => {
        expect(pickTrailer([video({key: "t", type: "Teaser"})], "en")?.key).toBe("t");
        expect(pickTrailer([video({type: "Clip"})], "en")).toBeNull();
    });
});

describe("regionOffers", () => {
    it("takes the first preferred country that has offers", () => {
        const results = {US: {link: "us"}, RU: {link: "ru"}};
        expect(regionOffers(results, ["AZ", "RU", "US"])?.region).toBe("RU");
        expect(regionOffers(results, ["AZ"])).toBeNull();
    });
});

describe("providerGroups", () => {
    it("merges free and ad-supported into streaming, orders by priority and drops empty kinds", () => {
        const groups = providerGroups({link: "x", flatrate: [provider(1, 5)], free: [provider(2, 1)], ads: [provider(1, 5)], buy: [provider(3, 2)]});
        expect(groups.map((group) => group.kind)).toEqual(["stream", "buy"]);
        expect(groups[0].providers.map((item) => item.provider_id)).toEqual([2, 1]);
    });
});
