import {api, ApiError, segment} from "@/api/client";
import type {MediaSnapshot} from "@/api/library.api";
import type {Credits, Genre} from "@/api/people.api";
import type {SeriesDetails} from "@/api/series.api";
import type {AggregateCredits} from "@/api/titleExtras.api";
import {moviePeople, seriesSnapshot} from "@/helpers/library";
import {API_ENDPOINTS} from "@/constants/endpoints";
import {MEDIA_TYPE, type MediaType} from "@/constants/other";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** TMDB answers 429 when asked too fast; a short pause and another try is what it asks for. */
export const withRetry = async <T>(request: () => Promise<T>, attempts = 3): Promise<T> => {
    try {
        return await request();
    } catch (error) {
        if (attempts > 1 && error instanceof ApiError && (error.status === 429 || error.isNetworkError)) {
            await wait(1500);
            return withRetry(request, attempts - 1);
        }
        throw error;
    }
};

type MovieBasics = {
    id: number;
    title: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    genres: Genre[];
    runtime: number | null;
    credits: Credits;
};

/** What the library keeps about a film found by an import: poster, year, genres, runtime and people. */
export const getMovieSnapshot = async (tmdbId: number): Promise<MediaSnapshot> => {
    const movie = await withRetry(() => api.get<MovieBasics>(`${API_ENDPOINTS.MOVIE}/${segment(tmdbId)}`, {params: {append_to_response: "credits"}}));
    return {
        id: movie.id,
        mediaType: MEDIA_TYPE.MOVIE,
        title: movie.title,
        posterPath: movie.poster_path,
        backdropPath: movie.backdrop_path,
        year: (movie.release_date ?? "").slice(0, 4),
        genres: movie.genres.map((genre) => genre.name),
        runtime: movie.runtime,
        series: null,
        people: moviePeople(movie.credits),
    };
};

/** The same for a series, with its season layout so progress and "up next" work at once. */
export const getSeriesSnapshot = async (tmdbId: number): Promise<MediaSnapshot> => {
    const series = await withRetry(() =>
        api.get<Omit<SeriesDetails, "credits" | "aggregate_credits"> & {aggregate_credits: AggregateCredits}>(
            `${API_ENDPOINTS.TV}/${segment(tmdbId)}`,
            {params: {append_to_response: "aggregate_credits"}},
        ));
    // Only the parts a snapshot reads; the cast comes from the aggregate credits.
    return seriesSnapshot({...series, credits: {cast: [], crew: []}} as SeriesDetails);
};

export const getSnapshot = (mediaType: MediaType, tmdbId: number): Promise<MediaSnapshot> =>
    mediaType === MEDIA_TYPE.MOVIE ? getMovieSnapshot(tmdbId) : getSeriesSnapshot(tmdbId);
