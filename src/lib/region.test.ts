import {describe, expect, it, vi} from "vitest";

const locales = vi.hoisted(() => ({list: [] as {regionCode: string | null}[]}));

vi.mock("expo-localization", () => ({getLocales: () => locales.list}));

const {regionName, watchRegions} = await import("@/lib/region");

describe("watchRegions", () => {
    it("tries the device's countries, then the app language's, then the US, without repeats", () => {
        locales.list = [{regionCode: "AZ"}, {regionCode: null}, {regionCode: "TR"}];
        expect(watchRegions("ru")).toEqual(["AZ", "TR", "RU", "US"]);
        locales.list = [{regionCode: "US"}];
        expect(watchRegions("en")).toEqual(["US"]);
    });

    it("falls back to the US for a language with no country of its own", () => {
        locales.list = [];
        expect(watchRegions("az")).toEqual(["US"]);
    });
});

describe("regionName", () => {
    it("names a country in the app language, or keeps the code when the engine cannot", () => {
        expect(regionName("DE", "en")).toBe("Germany");
        expect(regionName("ZZ", "en")).toBeTruthy();
    });
});
