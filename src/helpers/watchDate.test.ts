import {describe, expect, it} from "vitest";
import {isFutureDay, monthGrid, quickDayOf, watchedAtFor} from "@/helpers/watchDate";

describe("monthGrid", () => {
    it("starts weeks on Monday and pads both ends", () => {
        // November 2026 starts on a Sunday and has 30 days.
        const weeks = monthGrid(2026, 10);
        expect(weeks).toHaveLength(6);
        expect(weeks[0].slice(0, 6)).toEqual([null, null, null, null, null, null]);
        expect(weeks[0][6]?.getDate()).toBe(1);
        expect(weeks.at(-1)?.[0]?.getDate()).toBe(30);
        expect(weeks.every((week) => week.length === 7)).toBe(true);
    });
});

describe("watchedAtFor", () => {
    const now = new Date(2026, 10, 6, 14, 30);

    it("keeps the current moment for today and uses the evening of a past day", () => {
        expect(watchedAtFor(new Date(2026, 10, 6), now)).toBe(now.toISOString());
        expect(watchedAtFor(new Date(2026, 10, 5), now)).toBe(new Date(2026, 10, 5, 20).toISOString());
    });
});

describe("quickDayOf and isFutureDay", () => {
    const now = new Date(2026, 10, 6, 14, 30);

    it("matches today and yesterday, everything else is another day", () => {
        expect(quickDayOf(new Date(2026, 10, 6, 9).toISOString(), now)).toBe("today");
        expect(quickDayOf(new Date(2026, 10, 5, 20).toISOString(), now)).toBe("yesterday");
        expect(quickDayOf(new Date(2026, 9, 1, 20).toISOString(), now)).toBe("other");
    });

    it("rejects days after today", () => {
        expect(isFutureDay(new Date(2026, 10, 7), now)).toBe(true);
        expect(isFutureDay(new Date(2026, 10, 6), now)).toBe(false);
    });
});
