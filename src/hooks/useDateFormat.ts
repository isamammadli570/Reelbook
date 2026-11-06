import {useMemo} from "react";
import {useTranslation} from "react-i18next";
import {
    formatDayMonth,
    formatDayNumber,
    formatLongDate,
    formatMonthYear,
    formatShortDate,
    formatShortMonthYear,
    parseDate,
    type MonthNames,
} from "@/helpers/dates";

const asList = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : []);

/** Date formatters in the current app language; each accepts an ISO string or a plain air date. */
export const useDateFormat = () => {
    const {t} = useTranslation();

    return useMemo(() => {
        const names: MonthNames = {
            months: asList(t("months", {returnObjects: true})),
            monthsShort: asList(t("monthsShort", {returnObjects: true})),
            monthsOf: asList(t("monthsOf", {returnObjects: true})),
        };
        // Sunday first, matching `Date.getDay()`.
        const weekdays = asList(t("weekdaysShort", {returnObjects: true}));
        const withDate = (format: (date: Date) => string) => (value: string | null | undefined): string | null => {
            const date = parseDate(value);
            return date ? format(date) : null;
        };

        return {
            monthName: (month: number): string => names.months[month] ?? "",
            shortDate: withDate((date) => formatShortDate(date, names)),
            dayMonth: withDate((date) => formatDayMonth(date, names)),
            longDate: withDate((date) => formatLongDate(date, names)),
            monthYear: withDate((date) => formatMonthYear(date, names)),
            shortMonthYear: withDate((date) => formatShortMonthYear(date, names)),
            dayNumber: withDate(formatDayNumber),
            weekdayShort: (date: Date): string => weekdays[date.getDay()] ?? "",
        };
    }, [t]);
};
