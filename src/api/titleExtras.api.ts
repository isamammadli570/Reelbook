import type {CastMember} from "@/api/people.api";

/** A logo or other picture TMDB keeps for a title, tagged with the language of any text on it. */
export type TitleImage = {
    file_path: string;
    iso_639_1: string | null;
    aspect_ratio: number;
    vote_average: number;
};

export type TitleImages = {logos: TitleImage[]};

/** Movie certificates per country; `type` 3 is the cinema release. */
export type ReleaseDates = {
    results: {iso_3166_1: string; release_dates: {certification: string; type: number}[]}[];
};

/** Series ratings per country, such as TV-MA. */
export type ContentRatings = {results: {iso_3166_1: string; rating: string}[]};

/** A series' cast across every season, with how many episodes each person played. */
export type AggregateCredits = {
    cast: (Pick<CastMember, "id" | "name" | "profile_path"> & {
        roles: {character: string; episode_count: number}[];
        total_episode_count: number;
    })[];
};

/** Asked with every movie and series request: the extra blocks below come back in the same response. */
export const MOVIE_EXTRAS_APPEND = "release_dates,images";
export const SERIES_EXTRAS_APPEND = "content_ratings,aggregate_credits,images";

/** Logos with English text, or none, as a fallback where none exists in the app language. */
export const IMAGE_LANGUAGES = "en,ru,null";
