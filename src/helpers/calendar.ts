import type {EpisodeSummary} from "@/api/series.api";

/** A followed series as the calendar sees it: its details plus every episode of its latest season. */
export type TrackedSeries = {
    id: number;
    title: string;
    posterPath: string | null;
    network: string | null;
    episodes: EpisodeSummary[];
};

export type UpcomingEpisode = {
    seriesId: number;
    title: string;
    posterPath: string | null;
    network: string | null;
    season: number;
    episode: number;
    episodeName: string;
    airDate: string;
    runtime: number | null;
};

export type DayGroup = {day: string; items: UpcomingEpisode[]};

const pad = (value: number): string => String(value).padStart(2, "0");

/** A local calendar day as `YYYY-MM-DD`, the same shape TMDB uses for air dates. */
export const toIsoDay = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const addDays = (date: Date, days: number): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export const weekFrom = (start: Date, count = 7): Date[] => Array.from({length: count}, (_, index) => addDays(start, index));

/** Every tracked episode that airs inside the window, soonest first. */
export const upcomingEpisodes = (series: TrackedSeries[], today: Date, days = 7): UpcomingEpisode[] => {
    const from = toIsoDay(today);
    const to = toIsoDay(addDays(today, days - 1));

    return series
        .flatMap((show) => {
            const seen = new Set<number>();
            return show.episodes.flatMap((episode): UpcomingEpisode[] => {
                if (seen.has(episode.id)) return [];
                seen.add(episode.id);
                if (!episode.air_date || episode.air_date < from || episode.air_date > to) return [];
                return [{
                    seriesId: show.id,
                    title: show.title,
                    posterPath: show.posterPath,
                    network: show.network,
                    season: episode.season_number,
                    episode: episode.episode_number,
                    episodeName: episode.name,
                    airDate: episode.air_date,
                    runtime: episode.runtime,
                }];
            });
        })
        .sort((a, b) => a.airDate.localeCompare(b.airDate) || a.title.localeCompare(b.title));
};

export const groupByDay = (episodes: UpcomingEpisode[]): DayGroup[] => {
    const groups = new Map<string, UpcomingEpisode[]>();
    episodes.forEach((episode) => groups.set(episode.airDate, [...(groups.get(episode.airDate) ?? []), episode]));
    return [...groups].map(([day, items]) => ({day, items}));
};
