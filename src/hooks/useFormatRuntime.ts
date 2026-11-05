import {useCallback} from "react";
import {useTranslation} from "react-i18next";
import {splitRuntime} from "@/helpers/details";

/** "2 s 46 dəq" for long runtimes, "45 dəq" for short ones, null when TMDB has no runtime. */
export const useFormatRuntime = () => {
    const {t} = useTranslation("details");

    return useCallback((totalMinutes: number | null | undefined): string | null => {
        if (!totalMinutes) return null;
        const {hours, minutes} = splitRuntime(totalMinutes);
        return hours > 0 ? t("runtime", {hours, minutes}) : t("minutes", {count: minutes});
    }, [t]);
};
