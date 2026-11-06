import type {GenreTile} from "@/constants/genres";
import {MEDIA_TYPE, type MediaType} from "@/constants/other";

/** The TMDB genre id that matches a tile for the given kind of title. */
export const genreIdFor = (genre: GenreTile, mediaType: MediaType): number => (mediaType === MEDIA_TYPE.MOVIE ? genre.movieId : genre.tvId);
