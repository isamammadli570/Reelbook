import {api, segment} from "@/api/client";
import {API_ENDPOINTS} from "@/constants/endpoints";
import {MEDIA_TYPE} from "@/constants/other";
import type {MediaSummary} from "@/api/media.api";

/** A title's ids on other sites; any of them may be missing or an empty string. */
export type ExternalIds = {
    imdb_id?: string | null;
    wikidata_id?: string | null;
    facebook_id?: string | null;
    instagram_id?: string | null;
    twitter_id?: string | null;
};

/** Appended to the movie and series requests, so the ids arrive with the page. */
export const EXTERNAL_IDS_APPEND = "external_ids";

type FindResponse = {movie_results: MediaSummary[]; tv_results: MediaSummary[]};

/**
 * The movie or series behind an IMDb id such as "tt0903747", or `null` when TMDB does not know it.
 * Imports from Letterboxd and Trakt carry IMDb ids, so this is how their titles are matched.
 */
export const findByImdbId = async (imdbId: string): Promise<MediaSummary | null> => {
    const found = await api.get<FindResponse>(`${API_ENDPOINTS.FIND}/${segment(imdbId)}`, {params: {external_source: "imdb_id"}});
    const movie = found.movie_results[0];
    if (movie) return {...movie, media_type: MEDIA_TYPE.MOVIE};
    const series = found.tv_results[0];
    return series ? {...series, media_type: MEDIA_TYPE.TV} : null;
};
