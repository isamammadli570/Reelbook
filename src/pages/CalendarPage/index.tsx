import {useMemo, useState} from "react";
import {Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {EmptyState} from "@/widgets/EmptyState";
import {PageTitle} from "@/widgets/PageTitle";
import {QueryErrorState} from "@/widgets/QueryErrorState";
import {Screen} from "@/widgets/Screen";
import {Section} from "@/widgets/Section";
import {Skeleton} from "@/components/ui/skeleton";
import {EpisodeCard} from "@/pages/CalendarPage/widgets/EpisodeCard";
import {WeekStrip} from "@/pages/CalendarPage/widgets/WeekStrip";
import {useCalendar} from "@/hooks/calendar";
import {useSession} from "@/hooks/auth/useSession";
import {hasSupabase} from "@/lib/env";
import {AccountRequired} from "@/widgets/AccountRequired";
import {useDateFormat} from "@/hooks/useDateFormat";
import {addDays, groupByDay, toIsoDay, weekFrom} from "@/helpers/calendar";

/** What is airing this week for the series the user follows, grouped by day. */
export const CalendarPage = () => {
    const {t} = useTranslation("calendar");
    const {monthYear, dayMonth} = useDateFormat();
    const [today] = useState(() => new Date());
    const {episodes, trackedCount, isLoading, isError, error, refetch} = useCalendar(today);
    const {session, isLoading: isSessionLoading} = useSession();
    const isGuest = hasSupabase && !session && !isSessionLoading;

    const days = useMemo(() => weekFrom(today), [today]);
    const daysWithEpisodes = useMemo(() => new Set(episodes.map((episode) => episode.airDate)), [episodes]);
    const groups = useMemo(() => groupByDay(episodes), [episodes]);

    const todayKey = toIsoDay(today);
    const tomorrowKey = toIsoDay(addDays(today, 1));
    const dayLabel = (day: string): string => {
        if (day === todayKey) return t("today");
        if (day === tomorrowKey) return t("tomorrow");
        return dayMonth(day) ?? day;
    };

    const renderBody = () => {
        if (!trackedCount) return <EmptyState title={t("noTracked.title")} description={t("noTracked.description")}/>;
        if (isLoading) return Array.from({length: 3}, (_, index) => <Skeleton key={index} className="h-[92px] w-full rounded-2xl"/>);
        if (isError) return <QueryErrorState error={error} onRetry={refetch}/>;
        if (!episodes.length) return <EmptyState title={t("noneThisWeek.title")} description={t("noneThisWeek.description")}/>;

        return groups.map((group) => (
            <Section key={group.day} title={dayLabel(group.day)}>
                <View className="gap-2.5">
                    {group.items.map((episode) => (
                        <EpisodeCard key={`${episode.seriesId}-${episode.season}-${episode.episode}`} episode={episode}/>
                    ))}
                </View>
            </Section>
        ));
    };

    if (isGuest) {
        return (
            <Screen>
                <PageTitle title={t("title")}/>
                <AccountRequired description={t("guestDescription")}/>
            </Screen>
        );
    }

    return (
        <Screen>
            <PageTitle title={t("title")} eyebrow={monthYear(todayKey) ?? undefined}/>
            <WeekStrip days={days} today={today} daysWithEpisodes={daysWithEpisodes}/>
            {trackedCount > 0 && !isLoading && !isError && <Text className="-mt-3 font-sans text-[13px] text-muted-foreground">{t("thisWeek", {count: episodes.length})}</Text>}
            {renderBody()}
        </Screen>
    );
};
