import type {LibraryItem} from "@/api/library.api";
import {toIsoDay} from "@/helpers/calendar";
import {itemKey} from "@/helpers/library";
import {MEDIA_TYPE, type MediaType} from "@/constants/other";

export const ACTIVITY_KIND = {WATCH: "watch", REVIEW: "review", EPISODES: "episodes"} as const;
export type ActivityKind = (typeof ACTIVITY_KIND)[keyof typeof ACTIVITY_KIND];

/** One thing someone did, as their friends see it in the feed. */
export type ActivityEvent = {
    /** Unique per person: publishing the same event again updates it instead of adding a copy. */
    eventKey: string;
    itemKey: string;
    kind: ActivityKind;
    mediaType: MediaType;
    mediaId: number;
    title: string;
    posterPath: string | null;
    year: string;
    rating: number | null;
    review: string | null;
    episodeCount: number | null;
    happenedAt: string;
};

/**
 * What a title in the library tells friends: each film viewing with the stars given then, the review, and for
 * a series one event per day with how many episodes were watched. Derived from the item every time, so an
 * edit or a deletion in the library is reflected by publishing the title's events again.
 */
export const eventsOf = (item: LibraryItem): ActivityEvent[] => {
    const key = itemKey(item.mediaType, item.id);
    const base = {itemKey: key, mediaType: item.mediaType, mediaId: item.id, title: item.title, posterPath: item.posterPath, year: item.year};
    const events: ActivityEvent[] = [];

    if (item.mediaType === MEDIA_TYPE.MOVIE) {
        item.diary.forEach((entry) => events.push({
            ...base,
            eventKey: `watch:${entry.id}`,
            kind: ACTIVITY_KIND.WATCH,
            rating: entry.rating,
            review: null,
            episodeCount: null,
            happenedAt: entry.watchedAt,
        }));
    } else {
        // Episodes by the day they were watched (the device's calendar); the event takes that day's last time.
        const days = new Map<string, {count: number; latest: string}>();
        Object.values(item.episodes).forEach((watchedAt) => {
            const date = new Date(watchedAt);
            if (Number.isNaN(date.getTime())) return;
            const day = toIsoDay(date);
            const current = days.get(day);
            days.set(day, {count: (current?.count ?? 0) + 1, latest: current && current.latest > watchedAt ? current.latest : watchedAt});
        });
        days.forEach(({count, latest}, day) => events.push({
            ...base,
            eventKey: `episodes:${key}:${day}`,
            kind: ACTIVITY_KIND.EPISODES,
            rating: item.rating,
            review: null,
            episodeCount: count,
            happenedAt: latest,
        }));
    }

    if (item.review) {
        events.push({
            ...base,
            eventKey: `review:${key}`,
            kind: ACTIVITY_KIND.REVIEW,
            rating: item.rating,
            review: item.review.text,
            episodeCount: null,
            happenedAt: item.review.updatedAt,
        });
    }
    return events;
};

/** Text for a search box safe to put in a database filter: letters, digits, spaces, "_" and "."; "@" dropped. */
export const cleanUserQuery = (query: string): string =>
    query.trim().replace(/^@+/, "").replace(/[^\p{L}\p{N}_. ]+/gu, "").slice(0, 40);

export type RelativeTime = {unit: "now" | "minutes" | "hours" | "days" | "weeks"; count: number} | {unit: "date"; count: 0};

/**
 * How long ago something happened, for "2 hours ago": up to four weeks, then the date itself reads better.
 * Times in the future (a viewing logged for tonight) count as now.
 */
export const relativeTime = (iso: string, now: Date): RelativeTime => {
    const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000);
    if (Number.isNaN(minutes) || minutes < 1) return {unit: "now", count: 0};
    if (minutes < 60) return {unit: "minutes", count: minutes};
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return {unit: "hours", count: hours};
    const days = Math.floor(hours / 24);
    if (days < 7) return {unit: "days", count: days};
    const weeks = Math.floor(days / 7);
    return weeks < 5 ? {unit: "weeks", count: weeks} : {unit: "date", count: 0};
};
