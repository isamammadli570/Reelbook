import {api, segment} from "@/api/client";
import {API_ENDPOINTS} from "@/constants/endpoints";
import {MEDIA_TYPE} from "@/constants/other";
import type {MediaSummary, Paged} from "@/api/media.api";
import type {Credits, Genre} from "@/api/people.api";
import {VIDEO_LANGUAGES, WATCH_APPEND, type WatchExtras} from "@/api/watch.api";

export type MovieDetails = {
    id: number;
    title: string;
    original_title: string;
    overview: string;
    tagline: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    runtime: number | null;
    vote_average: number;
    vote_count: number;
    genres: Genre[];
    credits: Credits;
    recommendations: Paged<MediaSummary>;
} & WatchExtras;

/** One request for the whole movie page: details, cast and recommendations. */
export const getMovie = async (movieId: number): Promise<MovieDetails> => {
    const movie = await api.get<MovieDetails>(`${API_ENDPOINTS.MOVIE}/${segment(movieId)}`, {
        params: {append_to_response: `credits,recommendations,${WATCH_APPEND}`, include_video_language: VIDEO_LANGUAGES},
    });
    // Recommendations come back without `media_type` on some titles; the page only ever lists movies here.
    const recommendations = movie.recommendations.results.map((item) => ({...item, media_type: MEDIA_TYPE.MOVIE}));
    return {...movie, recommendations: {...movie.recommendations, results: recommendations}};
};
