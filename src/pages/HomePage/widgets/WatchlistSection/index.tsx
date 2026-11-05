import {useMemo} from "react";
import {Text} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {EmptyState} from "@/widgets/EmptyState";
import {PosterGrid} from "@/widgets/PosterGrid";
import {Section} from "@/widgets/Section";
import {useWatchlist} from "@/hooks/library";
import {toMediaSummary} from "@/helpers/library";
import {buildRoute} from "@/constants/routes";

/** Everything the user saved for later, newest first. */
export const WatchlistSection = () => {
    const {t} = useTranslation("home");
    const {items, isLoading} = useWatchlist();
    const posters = useMemo(() => items.map(toMediaSummary), [items]);

    return (
        <Section title={t("watchlist")} aside={posters.length > 0 && <Text className="font-sans text-[13px] text-muted-foreground">{t("watchlistCount", {count: posters.length})}</Text>}>
            {!isLoading && !posters.length
                ? <EmptyState title={t("watchlistEmpty.title")} description={t("watchlistEmpty.description")}/>
                : <PosterGrid items={posters} isLoading={isLoading} placeholderCount={4} onPress={(media) => router.push(buildRoute.media(media))}/>}
        </Section>
    );
};
