import {api, segment} from "@/api/client";
import {API_ENDPOINTS} from "@/constants/endpoints";
import {MEDIA_TYPE} from "@/constants/other";
import type {MediaSummary, Paged} from "@/api/media.api";
import type {Credits, Genre} from "@/api/people.api";
import {VIDEO_LANGUAGES, WATCH_APPEND, type WatchExtras} from "@/api/watch.api";
import {EXTERNAL_IDS_APPEND, type ExternalIds} from "@/api/externalIds.api";
import {IMAGE_LANGUAGES, MOVIE_EXTRAS_APPEND, type ReleaseDates, type TitleImages} from "@/api/titleExtras.api";

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
    /** The franchise it is part of, such as "Harry Potter Collection". */
    belongs_to_collection: {id: number; name: string; poster_path: string | null; backdrop_path: string | null} | null;
    release_dates: ReleaseDates;
    images: TitleImages;
    external_ids: ExternalIds;
    /** The official site, or an empty string. */
    homepage: string | null;
} & WatchExtras;

/** A franchise: its films, oldest first once sorted by the page. */
export type Collection = {
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    parts: MediaSummary[];
};

/** One request for the whole movie page: details, cast and recommendations. */
export const getMovie = async (movieId: number): Promise<MovieDetails> => {
    const movie = await api.get<MovieDetails>(`${API_ENDPOINTS.MOVIE}/${segment(movieId)}`, {
        params: {
            append_to_response: `credits,recommendations,${WATCH_APPEND},${MOVIE_EXTRAS_APPEND},${EXTERNAL_IDS_APPEND}`,
            include_video_language: VIDEO_LANGUAGES,
            include_image_language: IMAGE_LANGUAGES,
        },
    });
    // Recommendations come back without `media_type` on some titles; the page only ever lists movies here.
    const recommendations = movie.recommendations.results.map((item) => ({...item, media_type: MEDIA_TYPE.MOVIE}));
    return {...movie, recommendations: {...movie.recommendations, results: recommendations}};
};

export const getCollection = async (collectionId: number): Promise<Collection> => {
    const collection = await api.get<Collection>(`${API_ENDPOINTS.COLLECTION}/${segment(collectionId)}`);
    return {...collection, parts: collection.parts.map((part) => ({...part, media_type: MEDIA_TYPE.MOVIE}))};
};
