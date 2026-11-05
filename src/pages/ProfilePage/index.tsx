import {useMemo, useState} from "react";
import {Text} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {SegmentedControl} from "@/components/ui/segmented-control";
import {PosterGrid} from "@/widgets/PosterGrid";
import {Screen} from "@/widgets/Screen";
import {Section} from "@/widgets/Section";
import {StatStrip} from "@/widgets/StatStrip";
import {DiaryList} from "@/pages/ProfilePage/widgets/DiaryList";
import {LanguagePicker} from "@/pages/ProfilePage/widgets/LanguagePicker";
import {ProfileHeader} from "@/pages/ProfilePage/widgets/ProfileHeader";
import {useFavorites, useWatches, useWatchlist} from "@/hooks/library";
import {toMediaSummary} from "@/helpers/library";
import {summarize, watchTime} from "@/helpers/stats";
import {buildRoute} from "@/constants/routes";
import {POSTER_COLUMNS} from "@/constants/other";
import type {MediaSummary} from "@/api/media.api";

const PROFILE_TAB = {
    DIARY: "diary",
    FAVORITES: "favorites",
    WATCHLIST: "watchlist",
} as const;
type ProfileTab = (typeof PROFILE_TAB)[keyof typeof PROFILE_TAB];

const openMedia = (media: MediaSummary) => router.push(buildRoute.media(media));

/** The user's corner: who they are, all-time numbers, favourite four, diary, lists and the language switch. */
export const ProfilePage = () => {
    const {t} = useTranslation("profile");
    const [tab, setTab] = useState<ProfileTab>(PROFILE_TAB.DIARY);
    const {watches} = useWatches();
    const {items: favorites} = useFavorites();
    const {items: watchlist} = useWatchlist();

    const summary = useMemo(() => summarize(watches), [watches]);
    const favoritePosters = useMemo(() => favorites.map(toMediaSummary), [favorites]);
    const watchlistPosters = useMemo(() => watchlist.map(toMediaSummary), [watchlist]);

    const stats = [
        {value: String(summary.movies), label: t("stats.movies")},
        {value: String(summary.series), label: t("stats.series")},
        {value: summary.episodes.toLocaleString(), label: t("stats.episodes")},
        {value: watchTime(summary.minutes).hours.toLocaleString(), label: t("stats.hours")},
    ];
    const tabs = Object.values(PROFILE_TAB).map((value) => ({value, label: t(`tabs.${value}`)}));

    const renderTab = () => {
        if (tab === PROFILE_TAB.DIARY) return <DiaryList watches={watches}/>;
        const posters = tab === PROFILE_TAB.FAVORITES ? favoritePosters : watchlistPosters;
        if (!posters.length) return <Text className="py-6 text-center font-sans text-sm text-muted-foreground">{tab === PROFILE_TAB.FAVORITES ? t("favoritesTabEmpty") : t("watchlistEmpty")}</Text>;
        return <PosterGrid items={posters} onPress={openMedia}/>;
    };

    return (
        <Screen>
            <ProfileHeader/>
            <StatStrip stats={stats}/>
            <Section title={t("favorites")}>
                {favoritePosters.length
                    ? <PosterGrid items={favoritePosters.slice(0, POSTER_COLUMNS)} onPress={openMedia}/>
                    : <Text className="font-sans text-sm leading-5 text-muted-foreground">{t("favoritesEmpty")}</Text>}
            </Section>
            <SegmentedControl options={tabs} value={tab} onChange={setTab} label={t("title")}/>
            {renderTab()}
            <LanguagePicker/>
        </Screen>
    );
};
