import {describe, expect, it} from "vitest";
import {addDays, groupByDay, toIsoDay, upcomingEpisodes, weekFrom, type TrackedSeries} from "@/helpers/calendar";
import type {EpisodeSummary} from "@/api/series.api";

const today = new Date(2026, 10, 5);

const episode = (id: number, airDate: string | null): EpisodeSummary => ({
    id,
    name: "Pilot",
    season_number: 2,
    episode_number: id,
    air_date: airDate,
    runtime: 50,
});

const show = (id: number, airDates: (string | null)[]): TrackedSeries => ({
    id,
    title: `Show ${id}`,
    posterPath: null,
    network: "Apple TV+",
    episodes: airDates.map((airDate, index) => episode(index + 1, airDate)),
});

describe("toIsoDay and addDays", () => {
    it("formats local days and rolls over month ends", () => {
        expect(toIsoDay(today)).toBe("2026-11-05");
        expect(toIsoDay(addDays(today, 26))).toBe("2026-12-01");
    });
});

describe("weekFrom", () => {
    it("starts today and covers seven days", () => {
        const week = weekFrom(today);
        expect(week).toHaveLength(7);
        expect(toIsoDay(week[0])).toBe("2026-11-05");
        expect(toIsoDay(week[6])).toBe("2026-11-11");
    });
});

describe("upcomingEpisodes", () => {
    it("keeps episodes inside the seven-day window, soonest first", () => {
        const result = upcomingEpisodes([show(1, ["2026-11-11"]), show(2, ["2026-11-05"]), show(3, ["2026-11-12"]), show(4, ["2026-11-04"])], today);
        expect(result.map((item) => item.seriesId)).toEqual([2, 1]);
    });

    it("includes every episode of the week, not only the next one", () => {
        const result = upcomingEpisodes([show(1, ["2026-11-06", "2026-11-08", null])], today);
        expect(result.map((item) => item.episode)).toEqual([1, 2]);
    });

    it("counts an episode once even if it appears twice", () => {
        const duplicated: TrackedSeries = {...show(1, []), episodes: [episode(1, "2026-11-06"), episode(1, "2026-11-06")]};
        expect(upcomingEpisodes([duplicated], today)).toHaveLength(1);
    });
});

describe("groupByDay", () => {
    it("groups episodes airing the same day and keeps their order", () => {
        const episodes = upcomingEpisodes([show(1, ["2026-11-06"]), show(2, ["2026-11-06"]), show(3, ["2026-11-07"])], today);
        const groups = groupByDay(episodes);
        expect(groups.map((group) => group.day)).toEqual(["2026-11-06", "2026-11-07"]);
        expect(groups[0].items.map((item) => item.seriesId)).toEqual([1, 2]);
    });
});
