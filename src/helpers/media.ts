import {TMDB_IMAGE_BASE} from "@/constants/endpoints";
import type {ImageSize} from "@/constants/other";

type Titled = {title?: string; name?: string};
type Dated = {release_date?: string; first_air_date?: string};

export const mediaTitle = (media: Titled): string => media.title ?? media.name ?? "";

export const mediaYear = (media: Dated): string => (media.release_date || media.first_air_date || "").slice(0, 4);

/** Alternates two lists so a mixed feed shows movies and series side by side. */
export const interleave = <T>(first: T[], second: T[]): T[] =>
    first.flatMap((item, index) => (index < second.length ? [item, second[index]] : [item])).concat(second.slice(first.length));

export const imageUrl =(path: string | null | undefined, size: ImageSize): string | null => (path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null);
