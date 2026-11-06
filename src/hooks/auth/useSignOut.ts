import {useState} from "react";
import {router} from "expo-router";
import {useQueryClient} from "@tanstack/react-query";
import {useTranslation} from "react-i18next";
import {getCurrentSession, signOut} from "@/api/auth.api";
import {flushAndClearDevice} from "@/services/sync";
import {toast} from "@/lib/toast";
import {QUERY_KEYS} from "@/constants/other";
import {ROUTES} from "@/constants/routes";

/** Signs out only after the device's changes are safely uploaded, then returns to the home page as a guest. */
export const useSignOut = () => {
    const {t} = useTranslation("auth");
    const queryClient = useQueryClient();
    const [isSigningOut, setIsSigningOut] = useState(false);

    const run = async () => {
        setIsSigningOut(true);
        try {
            const session = await getCurrentSession();
            if (session) await flushAndClearDevice(session.user.id);
            await signOut();
            void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.LIBRARY]});
            void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.PROFILE]});
            void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.LISTS]});
            router.replace(ROUTES.HOME);
        } catch {
            toast.error(t("signOut.failed"));
        } finally {
            setIsSigningOut(false);
        }
    };

    return {signOut: run, isSigningOut};
};
