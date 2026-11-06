import {useMemo} from "react";
import {useQueries} from "@tanstack/react-query";
import {getSeason} from "@/api/series.api";
import {getSeries, type SeriesDetails} from "@/api/series.api";
import {useGetLibrary} from "@/hooks/library";
import {hasTmdbToken} from "@/lib/env";
import {upcomingEpisodes, type TrackedSeries} from "@/helpers/calendar";
import {MEDIA_TYPE, QUERY_KEYS} from "@/constants/other";

/** The season a calendar should read: the one TMDB is airing next, else the latest regular season. */
const calendarSeason = (details: SeriesDetails | undefined): number | null => {
    if (!details) return null;
    if (details.next_episode_to_air) return details.next_episode_to_air.season_number;
    const regular = details.seasons.filter((season) => season.season_number > 0);
    return regular.at(-1)?.season_number ?? null;
};

/** Upcoming episodes of the series the user follows. Each follows its latest season, so a whole week shows up, not just the next episode. */
export const useCalendar = (today: Date, days = 7) => {
    const {data: library, isLoading: isLibraryLoading} = useGetLibrary();
    const followed = useMemo(
        () => Object.values(library?.items ?? {}).filter((item) => item.mediaType === MEDIA_TYPE.TV && item.isFollowing),
        [library],
    );

    const details = useQueries({
        queries: followed.map((item) => ({
            queryKey: [QUERY_KEYS.SERIES, item.id],
            queryFn: () => getSeries(item.id),
            enabled: hasTmdbToken,
        })),
    });

    const seasonNumbers = followed.map((_, index) => calendarSeason(details[index]?.data));

    const seasons = useQueries({
        queries: followed.map((item, index) => ({
            queryKey: [QUERY_KEYS.SEASON, item.id, seasonNumbers[index]],
            queryFn: () => getSeason(item.id, seasonNumbers[index] ?? 0),
            enabled: hasTmdbToken && seasonNumbers[index] !== null,
        })),
    });

    const episodes = useMemo(() => {
        const tracked: TrackedSeries[] = followed.map((item, index) => {
            const info = details[index]?.data;
            const season = seasons[index]?.data;
            return {
                id: item.id,
                title: item.title,
                posterPath: item.posterPath,
                network: info?.networks[0]?.name ?? item.series?.network ?? null,
                episodes: [...(season?.episodes ?? []), ...(info?.next_episode_to_air ? [info.next_episode_to_air] : [])],
            };
        });
        return upcomingEpisodes(tracked, today, days);
    }, [followed, details, seasons, today, days]);

    const failed = [...details, ...seasons].find((query) => query.isError);

    return {
        episodes,
        trackedCount: followed.length,
        isLoading: isLibraryLoading || details.some((query) => query.isLoading) || seasons.some((query) => query.isLoading),
        isError: Boolean(failed),
        error: failed?.error instanceof Error ? failed.error : null,
        refetch: () => [...details, ...seasons].forEach((query) => void query.refetch()),
    };
};
