import {MEDIA_TYPE, type MediaType} from "@/constants/other";
import type {ExternalIds} from "@/api/externalIds.api";

export const EXTERNAL_SITE = {
    IMDB: "imdb",
    LETTERBOXD: "letterboxd",
    TMDB: "tmdb",
    WIKIPEDIA: "wikipedia",
    HOMEPAGE: "homepage",
} as const;
export type ExternalSite = (typeof EXTERNAL_SITE)[keyof typeof EXTERNAL_SITE];

export type ExternalLink = {site: ExternalSite; url: string};

const IMDB_ID = /^tt\d{5,}$/;

/** Whether a value is an IMDb title id, such as "tt0903747". */
export const isImdbId = (value: string | null | undefined): value is string => Boolean(value && IMDB_ID.test(value));

/** The IMDb id inside an id or an IMDb address ("https://www.imdb.com/title/tt0903747/"), or `null`. */
export const parseImdbId = (value: string): string | null => value.match(/tt\d{5,}/)?.[0] ?? null;

/** Wikipedias the app can send people to; Azerbaijani has few film articles, so it reads English. */
const wikiFor = (language: string): string => (language.toLowerCase().startsWith("ru") ? "ruwiki" : "enwiki");

type LinkInput = {
    mediaType: MediaType;
    tmdbId: number;
    externalIds: ExternalIds | undefined;
    homepage: string | null | undefined;
    language: string;
};

/**
 * Where else a title lives, in the order people look: IMDb, Letterboxd (films only), TMDB, Wikipedia, then its
 * own site. Letterboxd is reached through the TMDB id, which it resolves to the film. Trakt has no address that
 * works from an id without signing in, so it waits for the Trakt import, whose API gives the page itself.
 */
export const externalLinks = ({mediaType, tmdbId, externalIds, homepage, language}: LinkInput): ExternalLink[] => {
    const isMovie = mediaType === MEDIA_TYPE.MOVIE;
    const imdbId = externalIds?.imdb_id;
    const wikidataId = externalIds?.wikidata_id;
    const site = homepage?.trim();

    const links: (ExternalLink | null)[] = [
        isImdbId(imdbId) ? {site: EXTERNAL_SITE.IMDB, url: `https://www.imdb.com/title/${imdbId}/`} : null,
        isMovie ? {site: EXTERNAL_SITE.LETTERBOXD, url: `https://letterboxd.com/tmdb/${tmdbId}/`} : null,
        {site: EXTERNAL_SITE.TMDB, url: `https://www.themoviedb.org/${isMovie ? "movie" : "tv"}/${tmdbId}`},
        wikidataId ? {site: EXTERNAL_SITE.WIKIPEDIA, url: `https://www.wikidata.org/wiki/Special:GoToLinkedPage/${wikiFor(language)}/${wikidataId}`} : null,
        site && /^https?:\/\//.test(site) ? {site: EXTERNAL_SITE.HOMEPAGE, url: site} : null,
    ];
    return links.filter((link) => link !== null);
};
