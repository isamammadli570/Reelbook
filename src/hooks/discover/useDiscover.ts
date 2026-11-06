import {useQuery} from "@tanstack/react-query";
import {getByGenre, getNewReleases, searchAll} from "@/api/media.api";
import {hasTmdbToken} from "@/lib/env";
import {interleave} from "@/helpers/media";
import {genreIdFor} from "@/helpers/discover";
import {MEDIA_FILTER, MEDIA_TYPE, QUERY_KEYS, type MediaFilter, type MediaType} from "@/constants/other";
import type {GenreTile} from "@/constants/genres";

const MIN_QUERY_LENGTH = 2;

/** "All" asks both kinds of title and mixes them; a single kind is asked on its own. */
const fetchByFilter = async <T>(filter: MediaFilter, fetchOne: (mediaType: MediaType) => Promise<T[]>): Promise<T[]> => {
    if (filter !== MEDIA_FILTER.ALL) return fetchOne(filter);
    const [movies, series] = await Promise.all([fetchOne(MEDIA_TYPE.MOVIE), fetchOne(MEDIA_TYPE.TV)]);
    return interleave(movies, series);
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

export const useGenreMedia = (filter: MediaFilter, genre: GenreTile | null) =>
    useQuery({
        queryKey: [QUERY_KEYS.GENRE, filter, genre?.key ?? null],
        queryFn: async () => {
            if (!genre) return [];
            return fetchByFilter(filter, (mediaType) => getByGenre(mediaType, genreIdFor(genre, mediaType)));
        },
        enabled: hasTmdbToken && genre !== null,
    });
