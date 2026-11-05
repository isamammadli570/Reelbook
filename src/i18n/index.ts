import i18next, {changeLanguage} from "i18next";
import {initReactI18next} from "react-i18next";
import {getLocales} from "expo-localization";
import {NAMESPACES, RESOURCES, SUPPORTED_LANGUAGES, type Language} from "@/i18n/resources";
import {storage} from "@/lib/storage";
import {STORAGE_KEYS} from "@/constants/other";

const isSupported = (code: string | null | undefined): code is Language => SUPPORTED_LANGUAGES.includes(code as Language);

/** The first device language the app speaks, otherwise Azerbaijani. */
const detectLanguage = (): Language => getLocales().map((locale) => locale.languageCode).find(isSupported) ?? "az";

// The default instance's `use` is i18next's documented API; the named export would read as a React hook to lint.
// eslint-disable-next-line import/no-named-as-default-member
void i18next.use(initReactI18next)
    .init({
        resources: RESOURCES,
        ns: NAMESPACES,
        defaultNS: "common",
        lng: detectLanguage(),
        fallbackLng: "az",
        supportedLngs: SUPPORTED_LANGUAGES,
        interpolation: {escapeValue: false},
        react: {useSuspense: false},
    });

// A language picked in the profile wins over the device language; storage is async, so it applies right after start.
void storage.get<string>(STORAGE_KEYS.LANGUAGE).then((saved) => {
    if (isSupported(saved) && saved !== i18next.language) void changeLanguage(saved);
});

export default i18next;
