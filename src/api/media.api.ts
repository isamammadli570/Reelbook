import {api, segment} from "@/api/client";
import {API_ENDPOINTS} from "@/constants/endpoints";
import {TIME_WINDOW, type MediaFilter, type MediaType, type TimeWindow} from "@/constants/other";

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

/** `/trending/all` also returns people, which this app does not list. */
type TrendingResult = Omit<MediaSummary, "media_type"> & {media_type: MediaType | "person"};

const isMedia = (item: TrendingResult): item is MediaSummary => item.media_type !== "person";

export const getTrending = async (filter: MediaFilter, timeWindow: TimeWindow = TIME_WINDOW.WEEK): Promise<Paged<MediaSummary>> => {
    const page = await api.get<Paged<TrendingResult>>(`${API_ENDPOINTS.TRENDING}/${segment(filter)}/${segment(timeWindow)}`);
    return {...page, results: page.results.filter(isMedia)};
};
