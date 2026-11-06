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

/** Popular titles of one genre; the vote floor keeps obscure entries out. */
export const getByGenre = async (mediaType: MediaType, genreId: number): Promise<MediaSummary[]> => {
    const path = mediaType === MEDIA_TYPE.MOVIE ? API_ENDPOINTS.DISCOVER_MOVIE : API_ENDPOINTS.DISCOVER_TV;
    const page = await api.get<Paged<Omit<MediaSummary, "media_type">>>(path, {
        params: {with_genres: genreId, sort_by: "popularity.desc", "vote_count.gte": 50},
    });
    return toMedia(page.results, mediaType);
};

export const getTrending = async (filter: MediaFilter, timeWindow: TimeWindow = TIME_WINDOW.WEEK): Promise<Paged<MediaSummary>> => {
    const page = await api.get<Paged<MixedResult>>(`${API_ENDPOINTS.TRENDING}/${segment(filter)}/${segment(timeWindow)}`);
    return {...page, results: page.results.filter(isMedia)};
};
