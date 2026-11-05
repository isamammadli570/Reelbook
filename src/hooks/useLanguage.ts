import {useCallback} from "react";
import {useTranslation} from "react-i18next";
import {storage} from "@/lib/storage";
import {STORAGE_KEYS} from "@/constants/other";
import type {Language} from "@/i18n/resources";

/** The app language and a setter that also remembers the choice for the next launch. */
export const useLanguage = () => {
    const {i18n} = useTranslation();

    const changeLanguage = useCallback((language: Language) => {
        void i18n.changeLanguage(language);
        void storage.set(STORAGE_KEYS.LANGUAGE, language);
    }, [i18n]);

    return {language: (i18n.resolvedLanguage ?? i18n.language) as Language, changeLanguage};
};
