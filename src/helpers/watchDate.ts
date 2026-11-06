import {addDays, toIsoDay} from "@/helpers/calendar";
import {parseDate} from "@/helpers/dates";

/** A month as weeks of seven days, Monday first; days outside the month are `null`. */
export const monthGrid = (year: number, month: number): (Date | null)[][] => {
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leading = (first.getDay() + 6) % 7;
    const cells: (Date | null)[] = [
        ...Array.from({length: leading}, () => null),
        ...Array.from({length: daysInMonth}, (_, index) => new Date(year, month, index + 1)),
    ];
    while (cells.length % 7) cells.push(null);
    return Array.from({length: cells.length / 7}, (_, week) => cells.slice(week * 7, week * 7 + 7));
};

/** Hour used for a past day, since only the day was chosen; evening is when most films are watched. */
const PAST_DAY_HOUR = 20;

/**
 * The stored time for a viewing on `day`: the current moment for today, so today's logs keep their order,
 * and the evening of any earlier day.
 */
export const watchedAtFor = (day: Date, now: Date): string => {
    if (toIsoDay(day) === toIsoDay(now)) return now.toISOString();
    return new Date(day.getFullYear(), day.getMonth(), day.getDate(), PAST_DAY_HOUR).toISOString();
};

export type QuickDay = "today" | "yesterday" | "other";

/** Which shortcut a stored viewing date matches, so the sheet opens with it selected. */
export const quickDayOf = (watchedAt: string, now: Date): QuickDay => {
    const day = toIsoDay(parseDate(watchedAt) ?? now);
    if (day === toIsoDay(now)) return "today";
    if (day === toIsoDay(addDays(now, -1))) return "yesterday";
    return "other";
};

export const isSameDay = (a: Date, b: Date): boolean => toIsoDay(a) === toIsoDay(b);

/** Viewings can only be logged up to today. */
export const isFutureDay = (day: Date, now: Date): boolean => toIsoDay(day) > toIsoDay(now);
