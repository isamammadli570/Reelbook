import {api, segment} from "@/api/client";
import {API_ENDPOINTS} from "@/constants/endpoints";
import {MEDIA_TYPE} from "@/constants/other";
import type {MediaSummary, Paged} from "@/api/media.api";
import type {Credits, Genre} from "@/api/people.api";

export type SeasonSummary = {
    id: number;
    season_number: number;
    name: string;
    episode_count: number;
    air_date: string | null;
    poster_path: string | null;
};

export type EpisodeSummary = {
    id: number;
    name: string;
    season_number: number;
    episode_number: number;
    air_date: string | null;
    runtime: number | null;
};

export type SeriesDetails = {
    id: number;
    name: string;
    original_name: string;
    overview: string;
    tagline: string;
    poster_path: string | null;
    backdrop_path: string | null;
    first_air_date: string;
    last_air_date: string | null;
    status: string;
    number_of_seasons: number;
    number_of_episodes: number;
    episode_run_time: number[];
    vote_average: number;
    genres: Genre[];
    networks: {id: number; name: string}[];
    created_by: {id: number; name: string}[];
    seasons: SeasonSummary[];
    next_episode_to_air: EpisodeSummary | null;
    last_episode_to_air: EpisodeSummary | null;
    credits: Credits;
    recommendations: Paged<MediaSummary>;
};

export type Episode = EpisodeSummary & {
    overview: string;
    still_path: string | null;
    vote_average: number;
};

export type SeasonDetails = {
    id: number;
    name: string;
    season_number: number;
    overview: string;
    episodes: Episode[];
};

/** One request for the series page: details, season list, cast and recommendations. */
export const getSeries = async (seriesId: number): Promise<SeriesDetails> => {
    const series = await api.get<SeriesDetails>(`${API_ENDPOINTS.TV}/${segment(seriesId)}`, {
        params: {append_to_response: "credits,recommendations"},
    });
    const recommendations = series.recommendations.results.map((item) => ({...item, media_type: MEDIA_TYPE.TV}));
    return {...series, recommendations: {...series.recommendations, results: recommendations}};
};

export const getSeason = (seriesId: number, seasonNumber: number) =>
    api.get<SeasonDetails>(`${API_ENDPOINTS.TV}/${segment(seriesId)}/season/${segment(seasonNumber)}`);
