import {itemKey} from "@/helpers/library";
import {MEDIA_TYPE} from "@/constants/other";
import type {Watch} from "@/helpers/stats";

/** The titles watched most recently, each once, from watches sorted newest first. */
export const recentTitles = (watches: Watch[], limit = 4): Watch[] => {
    const seen = new Set<string>();
    const recent: Watch[] = [];
    for (const watch of watches) {
        if (recent.length >= limit) break;
        const key = itemKey(watch.item.mediaType, watch.item.id);
        if (seen.has(key)) continue;
        seen.add(key);
        recent.push(watch);
    }
    return recent;
};

/** The stars given at that viewing; a series is rated as a whole, so its own rating shows. */
export const watchRating = (watch: Watch): number | null => {
    if (watch.kind !== MEDIA_TYPE.MOVIE) return watch.item.rating;
    return watch.item.diary.find((entry) => entry.watchedAt === watch.watchedAt)?.rating ?? null;
};

export type DiaryMonth = {key: string; watches: Watch[]};

/** The diary as months, newest first, by the device's local calendar. */
export const diaryMonths = (watches: Watch[]): DiaryMonth[] => {
    const months: DiaryMonth[] = [];
    for (const watch of watches) {
        const date = new Date(watch.watchedAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const last = months.at(-1);
        if (last?.key === key) last.watches.push(watch);
        else months.push({key, watches: [watch]});
    }
    return months;
};

export type DiaryRow =
    | {kind: "month"; key: string; month: string}
    | {kind: "watch"; key: string; watch: Watch; isFirstOfDay: boolean};

const localDay = (iso: string): string => {
    const date = new Date(iso);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

/** The diary flattened for a virtual list: a heading row per month, then its viewings; the day shows once per day. */
export const diaryRows = (watches: Watch[]): DiaryRow[] =>
    diaryMonths(watches).flatMap((month): DiaryRow[] => [
        {kind: "month", key: `month-${month.key}`, month: month.key},
        ...month.watches.map((watch, position): DiaryRow => ({
            kind: "watch",
            key: `${watch.item.mediaType}-${watch.item.id}-${watch.watchedAt}`,
            watch,
            isFirstOfDay: position === 0 || localDay(month.watches[position - 1].watchedAt) !== localDay(watch.watchedAt),
        })),
    ]);
