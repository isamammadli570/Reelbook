import {useQuery} from "@tanstack/react-query";
import {getCollection, getMovie} from "@/api/movies.api";
import {getSeason, getSeries} from "@/api/series.api";
import {getPerson} from "@/api/people.api";
import {hasTmdbToken} from "@/lib/env";
import {QUERY_KEYS} from "@/constants/other";

const isValidId = (id: number): boolean => Number.isInteger(id) && id > 0;

export const useGetMovie = (movieId: number) =>
    useQuery({
        queryKey: [QUERY_KEYS.MOVIE, movieId],
        queryFn: () => getMovie(movieId),
        enabled: hasTmdbToken && isValidId(movieId),
    });

export const useGetSeries = (seriesId: number) =>
    useQuery({
        queryKey: [QUERY_KEYS.SERIES, seriesId],
        queryFn: () => getSeries(seriesId),
        enabled: hasTmdbToken && isValidId(seriesId),
    });

/** Episodes of one season; waits until the page knows which season to open. */
export const useGetSeason = (seriesId: number, seasonNumber: number | null) =>
    useQuery({
        queryKey: [QUERY_KEYS.SEASON, seriesId, seasonNumber],
        queryFn: () => getSeason(seriesId, seasonNumber ?? 0),
        enabled: hasTmdbToken && isValidId(seriesId) && seasonNumber !== null,
    });

export const useGetPerson = (personId: number) =>
    useQuery({
        queryKey: [QUERY_KEYS.PERSON, personId],
        queryFn: () => getPerson(personId),
        enabled: hasTmdbToken && isValidId(personId),
    });

/** A franchise's films; `null` while the movie has none, so the request is never made. */
export const useGetCollection = (collectionId: number | null) =>
    useQuery({
        queryKey: [QUERY_KEYS.COLLECTION, collectionId],
        queryFn: () => getCollection(collectionId ?? 0),
        enabled: hasTmdbToken && collectionId !== null && isValidId(collectionId),
    });
