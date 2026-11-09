import {useCallback} from "react";
import {useTranslation} from "react-i18next";
import {shareProfile} from "@/lib/shareProfile";
import {toast} from "@/lib/toast";

/** Shares a profile's link: the share sheet where there is one, otherwise it is copied and a toast says so. */
export const useShareProfile = () => {
    const {t} = useTranslation("profile");
    return useCallback((username: string) => {
        shareProfile(username, t("share.title", {username})).then(
            (result) => {
                if (result === "copied") toast.show({message: t("share.copied"), tone: "success"});
            },
            () => toast.error(t("share.failed")),
        );
    }, [t]);
};
