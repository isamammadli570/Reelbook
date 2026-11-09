import {ActivityIndicator} from "react-native";
import {useTranslation} from "react-i18next";
import {useCSSVariable} from "uniwind";
import {AccountRequired} from "@/widgets/AccountRequired";
import {BackButton} from "@/widgets/BackButton";
import {EmptyState} from "@/widgets/EmptyState";
import {QueryErrorState} from "@/widgets/QueryErrorState";
import {Screen} from "@/widgets/Screen";
import type {ProfileSource} from "@/hooks/social";

type ProfileSourceStateProps = {
    source: ProfileSource;
    /** What a guest is told on their own profile's pages. */
    guestDescription: string;
};

/** A whole page for every profile state other than ready: loading, failed, nobody by that name, hidden, or a guest. */
export const ProfileSourceState = ({source, guestDescription}: ProfileSourceStateProps) => {
    const {t} = useTranslation("social");
    const muted = String(useCSSVariable("--color-muted-foreground"));
    const username = source.username ?? "";

    const body = {
        ready: null,
        loading: <ActivityIndicator color={muted}/>,
        error: <QueryErrorState error={source.error} onRetry={source.retry}/>,
        notFound: <EmptyState title={t("user.notFound")} description={t("user.notFoundHint", {username})}/>,
        hidden: <EmptyState title={t("user.hidden")} description={t("user.hiddenHint", {username})}/>,
        guest: <AccountRequired description={guestDescription}/>,
    }[source.status];

    return (
        <Screen>
            <BackButton className="self-start"/>
            {body}
        </Screen>
    );
};
