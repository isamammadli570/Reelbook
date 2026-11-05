import {TMDB_IMAGE_BASE} from "@/constants/endpoints";
import type {ImageSize} from "@/constants/other";

type Titled = {title?: string; name?: string};
type Dated = {release_date?: string; first_air_date?: string};

export const mediaTitle = (media: Titled): string => media.title ?? media.name ?? "";

export const mediaYear = (media: Dated): string => (media.release_date || media.first_air_date || "").slice(0, 4);

export const imageUrl = (path: string | null | undefined, size: ImageSize): string | null => (path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null);
