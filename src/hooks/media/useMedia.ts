import {useMemo} from "react";
import {useQuery} from "@tanstack/react-query";
import {getTrending} from "@/api/media.api";
import {hasTmdbToken} from "@/lib/env";
import {QUERY_KEYS, TIME_WINDOW, type MediaFilter, type TimeWindow} from "@/constants/other";

/** Trending movies and/or series; disabled until a TMDB token is configured. */
export const useGetTrending = (filter: MediaFilter, timeWindow: TimeWindow = TIME_WINDOW.WEEK) => {
    const query = useQuery({
        queryKey: [QUERY_KEYS.TRENDING, filter, timeWindow],
        queryFn: () => getTrending(filter, timeWindow),
        enabled: hasTmdbToken,
    });

    const items = useMemo(() => query.data?.results ?? [], [query.data]);
    return {...query, items};
};
