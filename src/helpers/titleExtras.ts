import type {AggregateCredits, ContentRatings, ReleaseDates, TitleImage} from "@/api/titleExtras.api";
import type {PersonChip} from "@/widgets/CastRow";

/** TMDB's release type for the cinema release, whose certificate is the one people know. */
const THEATRICAL = 3;

/** The movie's certificate in the first of the countries that has one, cinema release first: "R", "16". */
export const movieCertification = (dates: ReleaseDates | undefined, regions: string[]): string | null => {
    for (const region of regions) {
        const entries = dates?.results.find((result) => result.iso_3166_1 === region)?.release_dates ?? [];
        const rated = entries.filter((entry) => entry.certification.trim());
        const best = rated.find((entry) => entry.type === THEATRICAL) ?? rated[0];
        if (best) return best.certification.trim();
    }
    return null;
};

/** The series' rating in the first of the countries that has one: "TV-MA", "16+". */
export const seriesCertification = (ratings: ContentRatings | undefined, regions: string[]): string | null => {
    for (const region of regions) {
        const rating = ratings?.results.find((result) => result.iso_3166_1 === region)?.rating.trim();
        if (rating) return rating;
    }
    return null;
};

/**
 * The title's logo to show in place of its name: one in the app language, else English, else one without text;
 * the best voted of those. Very tall logos are skipped, since they would not fit beside the poster.
 */
export const pickLogo = (logos: TitleImage[] | undefined, language: string): TitleImage | null => {
    const usable = (logos ?? []).filter((logo) => logo.aspect_ratio >= 1.2);
    for (const wanted of [language, "en", null]) {
        const matches = usable.filter((logo) => logo.iso_639_1 === wanted).sort((a, b) => b.vote_average - a.vote_average);
        if (matches[0]) return matches[0];
    }
    return null;
};

/**
 * A series' whole cast as portraits, in billing order: each with their main character and how many
 * episodes they were in, so a lead and a one-off guest read differently.
 */
export const seriesCast = (credits: AggregateCredits | undefined, episodesLabel: (count: number) => string): PersonChip[] =>
    (credits?.cast ?? []).map((member) => {
        const role = [...member.roles].sort((a, b) => b.episode_count - a.episode_count)[0];
        return {
            id: member.id,
            name: member.name,
            profile_path: member.profile_path,
            character: [role?.character, episodesLabel(member.total_episode_count)].filter(Boolean).join(" · "),
        };
    });

/** A franchise in the order it came out; films without a date (announced) go last. */
export const collectionParts = <T extends {release_date?: string}>(parts: T[]): T[] =>
    [...parts].sort((a, b) => (a.release_date || "9999").localeCompare(b.release_date || "9999"));

/** How many of the films the user has logged at least once. */
export const watchedInCollection = (parts: {id: number}[], isWatched: (id: number) => boolean): number =>
    parts.filter((part) => isWatched(part.id)).length;
