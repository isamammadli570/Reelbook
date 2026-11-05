import azCommon from "./locales/AZ/common.json";
import azHome from "./locales/AZ/home.json";
import azDetails from "./locales/AZ/details.json";
import enCommon from "./locales/EN/common.json";
import enHome from "./locales/EN/home.json";
import enDetails from "./locales/EN/details.json";
import ruCommon from "./locales/RU/common.json";
import ruHome from "./locales/RU/home.json";
import ruDetails from "./locales/RU/details.json";
import azProfile from "./locales/AZ/profile.json";
import azStats from "./locales/AZ/stats.json";
import enProfile from "./locales/EN/profile.json";
import enStats from "./locales/EN/stats.json";
import ruProfile from "./locales/RU/profile.json";
import ruStats from "./locales/RU/stats.json";

export const SUPPORTED_LANGUAGES = ["az", "en", "ru"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const NAMESPACES = ["common", "home", "details", "profile", "stats"] as const;

export const LANGUAGE_LABELS: Record<Language, string> = {az: "Azərbaycan", en: "English", ru: "Русский"};

export const RESOURCES = {
    az: {common: azCommon, home: azHome, details: azDetails, profile: azProfile, stats: azStats},
    en: {common: enCommon, home: enHome, details: enDetails, profile: enProfile, stats: enStats},
    ru: {common: ruCommon, home: ruHome, details: ruDetails, profile: ruProfile, stats: ruStats},
} as const;
