import {useCallback} from "react";
import {router} from "expo-router";
import {ROUTES} from "@/constants/routes";

/** Back when there is history; home when the page was opened directly (a shared web link). */
export const useGoBack = () =>
    useCallback(() => {
        if (router.canGoBack()) router.back();
        else router.replace(ROUTES.HOME);
    }, []);
