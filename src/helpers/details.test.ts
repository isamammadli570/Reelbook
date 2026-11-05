import {describe, expect, it} from "vitest";
import {defaultSeasonNumber, directorNames, formatScore, isReleased, orderSeasons, splitRuntime, withAlpha} from "@/helpers/details";
import type {SeasonSummary} from "@/api/series.api";

const season = (season_number: number, air_date: string | null): SeasonSummary => ({
    id: season_number,
    season_number,
    name: `Season ${season_number}`,
    episode_count: 10,
    air_date,
    poster_path: null,
});

describe("formatScore", () => {
    it("keeps one decimal and shows a dash for unrated titles", () => {
        expect(formatScore(8.734)).toBe("8.7");
        expect(formatScore(0)).toBe("—");
    });
});

describe("splitRuntime", () => {
    it("splits minutes into hours and minutes", () => {
        expect(splitRuntime(166)).toEqual({hours: 2, minutes: 46});
        expect(splitRuntime(45)).toEqual({hours: 0, minutes: 45});
    });
});

describe("directorNames", () => {
    it("keeps only directors", () => {
        expect(directorNames([{id: 1, name: "Denis", job: "Director"}, {id: 2, name: "Hans", job: "Original Music Composer"}])).toEqual(["Denis"]);
    });
});

describe("orderSeasons", () => {
    it("sorts regular seasons and moves specials last", () => {
        const ordered = orderSeasons([season(2, null), season(0, null), season(1, null)]);
        expect(ordered.map((item) => item.season_number)).toEqual([1, 2, 0]);
    });
});

describe("defaultSeasonNumber", () => {
    const today = new Date("2026-11-05");

    it("opens the latest season that has aired", () => {
        expect(defaultSeasonNumber([season(1, "2022-02-17"), season(2, "2025-01-17"), season(3, "2027-01-01")], today)).toBe(2);
    });

    it("falls back to the first season when nothing has aired", () => {
        expect(defaultSeasonNumber([season(0, null), season(1, null)], today)).toBe(1);
    });

    it("returns null without seasons", () => {
        expect(defaultSeasonNumber([], today)).toBeNull();
    });
});

describe("isReleased", () => {
    const today = new Date(2026, 10, 5, 22, 0);

    it("compares the plain air date with the local day", () => {
        expect(isReleased("2026-11-05", today)).toBe(true);
        expect(isReleased("2026-11-04", today)).toBe(true);
        expect(isReleased("2026-11-06", today)).toBe(false);
        expect(isReleased(null, today)).toBe(false);
    });
});

describe("withAlpha", () => {
    it("converts long and short hex colours", () => {
        expect(withAlpha("#0e0e10", 0)).toBe("rgba(14, 14, 16, 0)");
        expect(withAlpha("#fff", 0.5)).toBe("rgba(255, 255, 255, 0.5)");
    });
});
