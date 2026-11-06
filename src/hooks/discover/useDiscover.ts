import {useQuery} from "@tanstack/react-query";
import {useTranslation} from "react-i18next";
import {discoverTitles, getAiringToday, getNewReleases, getStreamingServices, getUpcoming, searchAll} from "@/api/media.api";
import {hasTmdbToken} from "@/lib/env";
import {watchRegions} from "@/lib/region";
import {interleave} from "@/helpers/media";
import {toIsoDay} from "@/helpers/calendar";
import {activeFilterCount, DISCOVER_SORT, discoverParams, EMPTY_FILTERS, mediaTypesFor, type DiscoverFilters} from "@/helpers/discover";
import {MEDIA_FILTER, MEDIA_TYPE, QUERY_KEYS, type MediaFilter, type MediaType} from "@/constants/other";
import type {GenreTile} from "@/constants/genres";
import type {MediaSummary} from "@/api/media.api";

const MIN_QUERY_LENGTH = 2;
/** Streaming services offered as filters: the most watched few, enough for one screen of logos. */
const SERVICE_LIMIT = 12;

/** "All" asks both kinds of title and mixes them; a single kind is asked on its own. */
const fetchByFilter = async <T>(filter: MediaFilter, fetchOne: (mediaType: MediaType) => Promise<T[]>): Promise<T[]> => {
    if (filter !== MEDIA_FILTER.ALL) return fetchOne(filter);
    const [movies, series] = await Promise.all([fetchOne(MEDIA_TYPE.MOVIE), fetchOne(MEDIA_TYPE.TV)]);
    return interleave(movies, series);
};

/** Asks each kind the query applies to and mixes the answers; kinds it cannot be asked for are skipped. */
const discoverMixed = async (types: MediaType[], paramsFor: (mediaType: MediaType) => Record<string, string | number> | null): Promise<MediaSummary[]> => {
    const lists = await Promise.all(types.map((mediaType) => {
        const params = paramsFor(mediaType);
        return params ? discoverTitles(mediaType, params) : Promise.resolve([]);
    }));
    return lists.length === 2 ? interleave(lists[0], lists[1]) : lists[0] ?? [];
};

export const useSearch = (query: string) =>
    useQuery({
        queryKey: [QUERY_KEYS.SEARCH, query],
        queryFn: () => searchAll(query),
        enabled: hasTmdbToken && query.length >= MIN_QUERY_LENGTH,
    });

export const useNewReleases = (filter: MediaFilter) =>
    useQuery({
        queryKey: [QUERY_KEYS.NEW_RELEASES, filter],
        queryFn: () => fetchByFilter(filter, getNewReleases),
        enabled: hasTmdbToken,
    });

/**
 * The streaming services of the user's country, most watched first, and that country: the first of the
 * device's countries (then the language's, then the US) that TMDB has streaming data for.
 */
export const useStreamingServices = (filter: MediaFilter) => {
    const {i18n} = useTranslation();
    const mediaType = filter === MEDIA_TYPE.TV ? MEDIA_TYPE.TV : MEDIA_TYPE.MOVIE;
    return useQuery({
        queryKey: [QUERY_KEYS.STREAMING_SERVICES, mediaType, i18n.language],
        queryFn: async () => {
            const regions = watchRegions(i18n.language);
            for (const region of regions) {
                const services = await getStreamingServices(mediaType, region);
                if (services.length) return {region, services: services.slice(0, SERVICE_LIMIT)};
            }
            return {region: regions.at(-1) ?? "US", services: []};
        },
        enabled: hasTmdbToken,
        staleTime: 24 * 60 * 60_000,
    });
};

/** Titles for a genre and filters; idle until either is set, since the page shows its lists until then. */
export const useDiscoverTitles = (filter: MediaFilter, genre: GenreTile | null, filters: DiscoverFilters, region: string) =>
    useQuery({
        queryKey: [QUERY_KEYS.DISCOVER, filter, genre?.key ?? null, filters, region],
        queryFn: () => {
            const today = toIsoDay(new Date());
            const types = genre ? mediaTypesFor(genre, filter) : filter === MEDIA_FILTER.ALL ? [MEDIA_TYPE.MOVIE, MEDIA_TYPE.TV] : [filter];
            return discoverMixed(types, (mediaType) => discoverParams(mediaType, {genre, filters, region, today}));
        },
        enabled: hasTmdbToken && (genre !== null || activeFilterCount(filters) > 0),
    });

/** Movies due in cinemas soon, in the user's country. */
export const useUpcoming = (enabled: boolean) => {
    const {i18n} = useTranslation();
    const region = watchRegions(i18n.language)[0] ?? "US";
    return useQuery({
        queryKey: [QUERY_KEYS.UPCOMING, region],
        queryFn: async () => {
            const today = toIsoDay(new Date());
            // TMDB's "upcoming" mixes in films already out; only the ones still to come are upcoming.
            return (await getUpcoming(region)).filter((movie) => (movie.release_date ?? "") > today);
        },
        enabled: hasTmdbToken && enabled,
    });
};

export const useAiringToday = (enabled: boolean) =>
    useQuery({
        queryKey: [QUERY_KEYS.AIRING_TODAY],
        queryFn: getAiringToday,
        enabled: hasTmdbToken && enabled,
    });

/** The best rated titles of all time for the filter, with enough votes to be fair. */
export const useTopRated = (filter: MediaFilter) =>
    useQuery({
        queryKey: [QUERY_KEYS.TOP_RATED, filter],
        queryFn: () => {
            const types = filter === MEDIA_FILTER.ALL ? [MEDIA_TYPE.MOVIE, MEDIA_TYPE.TV] : [filter];
            const filters = {...EMPTY_FILTERS, sort: DISCOVER_SORT.RATING};
            return discoverMixed(types, (mediaType) => discoverParams(mediaType, {genre: null, filters, region: "US", today: toIsoDay(new Date())}));
        },
        enabled: hasTmdbToken,
    });
