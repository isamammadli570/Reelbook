import type {Provider, RegionProviders, Video} from "@/api/watch.api";

/** How a title can be watched, in the order people look: included in a subscription, then rent, then buy. */
export const OFFER_KINDS = ["stream", "rent", "buy"] as const;
export type OfferKind = (typeof OFFER_KINDS)[number];

export type ProviderGroup = {kind: OfferKind; providers: Provider[]};

export const FALLBACK_REGION = "US";

const byPriority = (a: Provider, b: Provider): number => a.display_priority - b.display_priority;

const uniqueProviders = (providers: Provider[]): Provider[] => {
    const seen = new Set<number>();
    return providers.filter((provider) => {
        if (seen.has(provider.provider_id)) return false;
        seen.add(provider.provider_id);
        return true;
    });
};

/**
 * The best video to open as "the trailer": YouTube only, a trailer over a teaser, the app language over English,
 * the studio's own upload over a fan one, then the newest.
 */
export const pickTrailer = (videos: Video[], language: string): Video | null => {
    const score = (video: Video): number =>
        (video.type === "Trailer" ? 8 : 0) + (video.iso_639_1 === language ? 4 : 0) + (video.official ? 2 : 0);

    const candidates = videos.filter((video) => video.site === "YouTube" && (video.type === "Trailer" || video.type === "Teaser"));
    return [...candidates].sort((a, b) => score(b) - score(a) || b.published_at.localeCompare(a.published_at))[0] ?? null;
};

export const youtubeUrl = (key: string): string => `https://www.youtube.com/watch?v=${encodeURIComponent(key)}`;

/**
 * Offers in the first of the preferred countries that has any. JustWatch does not cover every country
 * (Azerbaijan among them), so callers end the list with a fallback.
 */
export const regionOffers = (results: Record<string, RegionProviders>, regions: string[]): {region: string; offers: RegionProviders} | null => {
    for (const region of regions) {
        const offers = results[region];
        if (offers) return {region, offers};
    }
    return null;
};

/** Free and ad-supported services count as streaming; a service offering both appears once. */
export const providerGroups = (offers: RegionProviders): ProviderGroup[] => {
    const byKind: Record<OfferKind, Provider[]> = {
        stream: [...(offers.flatrate ?? []), ...(offers.free ?? []), ...(offers.ads ?? [])],
        rent: offers.rent ?? [],
        buy: offers.buy ?? [],
    };
    return OFFER_KINDS
        .map((kind) => ({kind, providers: uniqueProviders([...byKind[kind]].sort(byPriority))}))
        .filter((group) => group.providers.length > 0);
};
