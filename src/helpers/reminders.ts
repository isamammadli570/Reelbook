import type {UpcomingEpisode} from "@/helpers/calendar";
import {parseDate} from "@/helpers/dates";

/** Reminders go out on the air day at this local hour: TMDB only knows the day, not the time. */
export const REMINDER_HOUR = 10;

/** iOS keeps at most 64 pending local notifications per app; staying under leaves room for the system. */
export const MAX_REMINDERS = 50;

export const REMINDER_PREFIX = "episode:";

export type PlannedReminder = {
    id: string;
    date: Date;
    episode: UpcomingEpisode;
};

export const reminderId = (episode: Pick<UpcomingEpisode, "seriesId" | "season" | "episode">): string =>
    `${REMINDER_PREFIX}${episode.seriesId}:${episode.season}:${episode.episode}`;

/** One reminder per upcoming episode, soonest first, skipping any whose morning has already passed. */
export const planReminders = (episodes: UpcomingEpisode[], now: Date, hour = REMINDER_HOUR, limit = MAX_REMINDERS): PlannedReminder[] =>
    episodes
        .flatMap((episode): PlannedReminder[] => {
            const day = parseDate(episode.airDate);
            if (!day) return [];
            const date = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour);
            return date > now ? [{id: reminderId(episode), date, episode}] : [];
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, limit);

/** What to change so the scheduled reminders match the plan: cancel stale ones, add missing ones, keep the rest. */
export const diffReminders = (scheduledIds: string[], planned: PlannedReminder[]): {cancel: string[]; add: PlannedReminder[]} => {
    const ours = scheduledIds.filter((id) => id.startsWith(REMINDER_PREFIX));
    const wanted = new Set(planned.map((reminder) => reminder.id));
    const existing = new Set(ours);
    return {
        cancel: ours.filter((id) => !wanted.has(id)),
        add: planned.filter((reminder) => !existing.has(reminder.id)),
    };
};
