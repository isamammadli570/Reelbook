import {GENRE_TRANSLATIONS} from "@/constants/genres";

/** A TMDB genre name in the app language; names without a translation (or already translated) are returned as they are. */
export const translateGenre = (name: string, language: string): string => {
    const translation = GENRE_TRANSLATIONS[name];
    if (!translation) return name;
    if (language.startsWith("az")) return translation.az;
    if (language.startsWith("ru")) return translation.ru;
    return name;
};
