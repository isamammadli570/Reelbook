import {useState} from "react";
import {router} from "expo-router";
import {useQueryClient} from "@tanstack/react-query";
import {useTranslation} from "react-i18next";
import {signOutAndClearDevice} from "@/services/sync";
import {resetAccountCache} from "@/lib/accountCache";
import {toast} from "@/lib/toast";
import {ROUTES} from "@/constants/routes";

/** Signs out only after the device's changes are safely uploaded, then returns to the home page as a guest. */
export const useSignOut = () => {
    const {t} = useTranslation("auth");
    const queryClient = useQueryClient();
    const [isSigningOut, setIsSigningOut] = useState(false);

    const run = async () => {
        setIsSigningOut(true);
        try {
            await signOutAndClearDevice();
            resetAccountCache(queryClient);
            router.replace(ROUTES.HOME);
        } catch {
            toast.error(t("signOut.failed"));
        } finally {
            setIsSigningOut(false);
        }
    };

    return {signOut: run, isSigningOut};
};
