/**
 * Dates are formatted from translated month names rather than `Intl`, because Hermes and several
 * browsers have no Azerbaijani locale data and print "M11" instead of "Noyabr".
 */
export type MonthNames = {
    /** Standalone, for headings: "Noyabr", "Ноябрь". */
    months: string[];
    monthsShort: string[];
    /** After a day number: "5 noyabr", "5 ноября". */
    monthsOf: string[];
};

const pad = (value: number): string => String(value).padStart(2, "0");

/** Plain `YYYY-MM-DD` air dates are local days; parsing them as UTC would shift them a day west of Greenwich. */
export const parseDate = (value: string | null | undefined): Date | null => {
    if (!value) return null;
    const plain = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const date = plain ? new Date(Number(plain[1]), Number(plain[2]) - 1, Number(plain[3])) : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

/** "5 noy 2026" */
export const formatShortDate = (date: Date, names: MonthNames): string => `${date.getDate()} ${names.monthsShort[date.getMonth()]} ${date.getFullYear()}`;

/** "14 aprel" */
export const formatDayMonth = (date: Date, names: MonthNames): string => `${date.getDate()} ${names.monthsOf[date.getMonth()]}`;

/** "Noyabr 2026" */
export const formatMonthYear = (date: Date, names: MonthNames): string => `${names.months[date.getMonth()]} ${date.getFullYear()}`;

/** "noy 26", under a big day number. */
export const formatShortMonthYear = (date: Date, names: MonthNames): string => `${names.monthsShort[date.getMonth()]} ${pad(date.getFullYear() % 100)}`;

/** "3 aprel 1973" */
export const formatLongDate = (date: Date, names: MonthNames): string => `${formatDayMonth(date, names)} ${date.getFullYear()}`;

/** "05" */
export const formatDayNumber = (date: Date): string => pad(date.getDate());
