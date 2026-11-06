import {api, segment} from "@/api/client";
import {API_ENDPOINTS} from "@/constants/endpoints";
import {MEDIA_TYPE, TIME_WINDOW, type MediaFilter, type MediaType, type TimeWindow} from "@/constants/other";
import type {PersonSummary} from "@/api/people.api";

export type Paged<TItem> = {
    page: number;
    results: TItem[];
    total_pages: number;
    total_results: number;
};

/** A movie or series as TMDB lists it: movies carry `title`/`release_date`, series `name`/`first_air_date`. */
export type MediaSummary = {
    id: number;
    media_type: MediaType;
    title?: string;
    name?: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date?: string;
    first_air_date?: string;
    vote_average: number;
    genre_ids: number[];
};

/** `/trending/all` and `/search/multi` mix titles with people. */
type MixedResult = MediaSummary | (PersonSummary & {media_type: "person"});

const isMedia = (item: MixedResult): item is MediaSummary => item.media_type !== "person";

const isPerson = (item: MixedResult): item is PersonSummary & {media_type: "person"} => item.media_type === "person";

const toMedia = (items: Omit<MediaSummary, "media_type">[], mediaType: MediaType): MediaSummary[] =>
    items.map((item) => ({...item, media_type: mediaType}));

export type SearchResults = {media: MediaSummary[]; people: PersonSummary[]};

/** One search for titles and people; people without a photo are left out, since they are rarely the one meant. */
export const searchAll = async (query: string): Promise<SearchResults> => {
    const page = await api.get<Paged<MixedResult>>(API_ENDPOINTS.SEARCH, {params: {query, include_adult: false}});
    return {
        media: page.results.filter(isMedia),
        people: page.results.filter(isPerson).filter((person) => person.profile_path),
    };
};

/** Movies in cinemas now, or series currently airing. */
export const getNewReleases = async (mediaType: MediaType): Promise<MediaSummary[]> => {
    const path = mediaType === MEDIA_TYPE.MOVIE ? API_ENDPOINTS.NOW_PLAYING : API_ENDPOINTS.ON_THE_AIR;
    const page = await api.get<Paged<Omit<MediaSummary, "media_type">>>(path);
    return toMedia(page.results, mediaType);
};

export const getTrending = async (filter: MediaFilter, timeWindow: TimeWindow = TIME_WINDOW.WEEK): Promise<Paged<MediaSummary>> => {
    const page = await api.get<Paged<MixedResult>>(`${API_ENDPOINTS.TRENDING}/${segment(filter)}/${segment(timeWindow)}`);
    return {...page, results: page.results.filter(isMedia)};
};

/** Movies due in cinemas soon, for the region the user is in. */
export const getUpcoming = async (region: string): Promise<MediaSummary[]> => {
    const page = await api.get<Paged<Omit<MediaSummary, "media_type">>>(API_ENDPOINTS.UPCOMING, {params: {region}});
    return toMedia(page.results, MEDIA_TYPE.MOVIE);
};

/** Series with an episode out today. */
export const getAiringToday = async (): Promise<MediaSummary[]> => {
    const page = await api.get<Paged<Omit<MediaSummary, "media_type">>>(API_ENDPOINTS.AIRING_TODAY);
    return toMedia(page.results, MEDIA_TYPE.TV);
};

/** Titles matching the discover filters; `params` comes from `discoverParams`. */
export const discoverTitles = async (mediaType: MediaType, params: Record<string, string | number>): Promise<MediaSummary[]> => {
    const path = mediaType === MEDIA_TYPE.MOVIE ? API_ENDPOINTS.DISCOVER_MOVIE : API_ENDPOINTS.DISCOVER_TV;
    const page = await api.get<Paged<Omit<MediaSummary, "media_type">>>(path, {params});
    return toMedia(page.results, mediaType);
};

export type StreamingService = {provider_id: number; provider_name: string; logo_path: string | null; display_priority: number};

/** The streaming services TMDB lists for a country, most watched first. */
export const getStreamingServices = async (mediaType: MediaType, region: string): Promise<StreamingService[]> => {
    const response = await api.get<{results: StreamingService[]}>(`${API_ENDPOINTS.WATCH_PROVIDERS}/${segment(mediaType)}`, {params: {watch_region: region}});
    return response.results.sort((a, b) => a.display_priority - b.display_priority);
};
