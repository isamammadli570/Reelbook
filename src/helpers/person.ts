import type {MediaSummary} from "@/api/media.api";
import type {PersonCredit, PersonDetails} from "@/api/people.api";
import {parseDate} from "@/helpers/dates";
import type {MediaType} from "@/constants/other";

export const initials = (name: string): string => name.split(" ").map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

/** TMDB's department names, as keys of `person:departments`. */
const DEPARTMENTS: Record<string, string> = {
    Acting: "acting",
    Directing: "directing",
    Writing: "writing",
    Production: "production",
    Sound: "sound",
    Camera: "camera",
    Editing: "editing",
    Art: "art",
    "Costume & Make-Up": "costume",
    "Visual Effects": "visualEffects",
    Lighting: "lighting",
    Crew: "crew",
};

/** The translation key for a department, or `null` for one TMDB adds later (shown as it comes). */
export const departmentKey = (department: string): string | null => DEPARTMENTS[department] ?? null;

export const creditTitle =(credit: PersonCredit): string => credit.title ?? credit.name ?? "";

export const creditDate = (credit: PersonCredit): string => credit.release_date || credit.first_air_date || "";

/** Whole years lived, up to the day they died; `null` without a birthday. */
export const personAge = (birthday: string | null, deathday: string | null, today: Date = new Date()): number | null => {
    const born = parseDate(birthday);
    if (!born) return null;
    const end = parseDate(deathday) ?? today;
    let age = end.getFullYear() - born.getFullYear();
    const hasHadBirthday = end.getMonth() > born.getMonth() || (end.getMonth() === born.getMonth() && end.getDate() >= born.getDate());
    if (!hasHadBirthday) age -= 1;
    return age;
};

/** Talk shows and award nights list people as themselves; those are not roles anyone means by "known for". */
const isSelfAppearance = (credit: PersonCredit): boolean => /\b(self|himself|herself|themselves)\b/i.test(credit.character ?? "");

/** The credits that match what the person is known for: acting roles for actors, crew work for everyone else. */
export const careerCredits = (person: PersonDetails): PersonCredit[] =>
    person.known_for_department === "Acting" ? person.combined_credits.cast : person.combined_credits.crew;

/** Their most voted-on titles with a poster, without repeats or appearances as themselves. */
export const knownFor = (person: PersonDetails, limit = 8): PersonCredit[] => {
    const seen = new Set<string>();
    return [...careerCredits(person)]
        .filter((credit) => credit.poster_path && !isSelfAppearance(credit))
        .sort((a, b) => b.vote_count - a.vote_count)
        .filter((credit) => {
            const key = `${credit.media_type}-${credit.id}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, limit);
};

export type FilmographyEntry = {credit: PersonCredit; roles: string[]};

/**
 * One row per title of the given kind, newest first; titles without a date (announced, not yet dated) come first.
 * A person credited twice on one title (two characters, or director and writer) gets both roles on one row.
 */
export const filmography = (credits: PersonCredit[], mediaType: MediaType): FilmographyEntry[] => {
    const byId = new Map<number, FilmographyEntry>();
    credits
        .filter((credit) => credit.media_type === mediaType)
        .forEach((credit) => {
            const role = credit.character || credit.job || "";
            const entry = byId.get(credit.id);
            if (entry) {
                if (role && !entry.roles.includes(role)) entry.roles.push(role);
            } else {
                byId.set(credit.id, {credit, roles: role ? [role] : []});
            }
        });

    return [...byId.values()].sort((a, b) => {
        const dateA = creditDate(a.credit);
        const dateB = creditDate(b.credit);
        if (!dateA !== !dateB) return dateA ? 1 : -1;
        return dateB.localeCompare(dateA) || creditTitle(a.credit).localeCompare(creditTitle(b.credit));
    });
};

/** Lets credits reuse the TMDB poster grid. */
export const creditToMediaSummary = (credit: PersonCredit): MediaSummary => ({
    id: credit.id,
    media_type: credit.media_type,
    title: credit.title,
    name: credit.name,
    overview: "",
    poster_path: credit.poster_path,
    backdrop_path: credit.backdrop_path,
    release_date: credit.release_date,
    first_air_date: credit.first_air_date,
    vote_average: credit.vote_average,
    genre_ids: [],
});
