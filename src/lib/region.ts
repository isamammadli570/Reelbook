import {getLocales} from "expo-localization";
import {FALLBACK_REGION} from "@/helpers/watch";

/** Countries implied by an app language, for devices whose region JustWatch does not cover. */
const LANGUAGE_REGIONS: Record<string, string> = {ru: "RU", en: "US"};

/** Where to look up streaming offers: the device's countries first, then the app language's, then the US. */
export const watchRegions = (language: string): string[] => {
    const device = getLocales().map((locale) => locale.regionCode).filter((code): code is string => Boolean(code));
    return [...new Set([...device, LANGUAGE_REGIONS[language], FALLBACK_REGION].filter(Boolean))];
};

/** "Türkiyə" from "TR" where the engine knows country names; the code itself where it does not (older Hermes). */
export const regionName = (region: string, language: string): string => {
    try {
        return new Intl.DisplayNames([language], {type: "region"}).of(region) ?? region;
    } catch {
        return region;
    }
};
