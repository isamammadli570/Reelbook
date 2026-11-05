import {describe, expect, it} from "vitest";
import {formatDayMonth, formatDayNumber, formatMonthYear, formatShortDate, formatShortMonthYear, parseDate, type MonthNames} from "@/helpers/dates";

const AZ: MonthNames = {
    months: ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"],
    monthsShort: ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avq", "sen", "okt", "noy", "dek"],
    monthsOf: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr"],
};

describe("parseDate", () => {
    it("reads a plain air date as that local day", () => {
        const date = parseDate("2026-11-05");
        expect([date?.getFullYear(), date?.getMonth(), date?.getDate()]).toEqual([2026, 10, 5]);
    });

    it("returns null for empty or broken values", () => {
        expect(parseDate(null)).toBeNull();
        expect(parseDate("")).toBeNull();
        expect(parseDate("not a date")).toBeNull();
    });
});

describe("formatters", () => {
    const date = new Date(2026, 10, 5);

    it("builds each format from the translated month names", () => {
        expect(formatShortDate(date, AZ)).toBe("5 noy 2026");
        expect(formatDayMonth(date, AZ)).toBe("5 noyabr");
        expect(formatMonthYear(date, AZ)).toBe("Noyabr 2026");
        expect(formatShortMonthYear(date, AZ)).toBe("noy 26");
        expect(formatDayNumber(date)).toBe("05");
    });
});
