import {useCallback} from "react";
import {useTranslation} from "react-i18next";
import {departmentKey} from "@/helpers/person";

/** "Acting" → "Aktyorluq"; a department TMDB adds later is shown as it comes. */
export const useDepartmentLabel = () => {
    const {t} = useTranslation("person");
    return useCallback((department: string): string => {
        const key = departmentKey(department);
        return key ? t(`departments.${key}`) : department;
    }, [t]);
};
