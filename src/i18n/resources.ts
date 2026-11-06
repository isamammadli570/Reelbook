import azAuth from "./locales/AZ/auth.json";
import azCalendar from "./locales/AZ/calendar.json";
import azCommon from "./locales/AZ/common.json";
import azDetails from "./locales/AZ/details.json";
import azDiscover from "./locales/AZ/discover.json";
import azHome from "./locales/AZ/home.json";
import azLists from "./locales/AZ/lists.json";
import azPerson from "./locales/AZ/person.json";
import azProfile from "./locales/AZ/profile.json";
import azSettings from "./locales/AZ/settings.json";
import azSocial from "./locales/AZ/social.json";
import azStats from "./locales/AZ/stats.json";
import enAuth from "./locales/EN/auth.json";
import enCalendar from "./locales/EN/calendar.json";
import enCommon from "./locales/EN/common.json";
import enDetails from "./locales/EN/details.json";
import enDiscover from "./locales/EN/discover.json";
import enHome from "./locales/EN/home.json";
import enLists from "./locales/EN/lists.json";
import enPerson from "./locales/EN/person.json";
import enProfile from "./locales/EN/profile.json";
import enSettings from "./locales/EN/settings.json";
import enSocial from "./locales/EN/social.json";
import enStats from "./locales/EN/stats.json";
import ruAuth from "./locales/RU/auth.json";
import ruCalendar from "./locales/RU/calendar.json";
import ruCommon from "./locales/RU/common.json";
import ruDetails from "./locales/RU/details.json";
import ruDiscover from "./locales/RU/discover.json";
import ruHome from "./locales/RU/home.json";
import ruLists from "./locales/RU/lists.json";
import ruPerson from "./locales/RU/person.json";
import ruProfile from "./locales/RU/profile.json";
import ruSettings from "./locales/RU/settings.json";
import ruSocial from "./locales/RU/social.json";
import ruStats from "./locales/RU/stats.json";

export const SUPPORTED_LANGUAGES = ["az", "en", "ru"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const NAMESPACES = ["common", "home", "details", "profile", "stats", "discover", "calendar", "auth", "settings", "lists", "person", "social"] as const;

export const LANGUAGE_LABELS: Record<Language, string> = {az: "Azərbaycan", en: "English", ru: "Русский"};

export const RESOURCES = {
    az: {common: azCommon, home: azHome, details: azDetails, profile: azProfile, stats: azStats, discover: azDiscover, calendar: azCalendar, auth: azAuth, settings: azSettings, lists: azLists, person: azPerson, social: azSocial},
    en: {common: enCommon, home: enHome, details: enDetails, profile: enProfile, stats: enStats, discover: enDiscover, calendar: enCalendar, auth: enAuth, settings: enSettings, lists: enLists, person: enPerson, social: enSocial},
    ru: {common: ruCommon, home: ruHome, details: ruDetails, profile: ruProfile, stats: ruStats, discover: ruDiscover, calendar: ruCalendar, auth: ruAuth, settings: ruSettings, lists: ruLists, person: ruPerson, social: ruSocial},
} as const;
