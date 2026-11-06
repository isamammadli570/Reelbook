import {useMemo, useState} from "react";
import {Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {SegmentedControl} from "@/components/ui/segmented-control";
import {EmptyState} from "@/widgets/EmptyState";
import {PageTitle} from "@/widgets/PageTitle";
import {Screen} from "@/widgets/Screen";
import {GenreBars} from "@/pages/StatsPage/widgets/GenreBars";
import {Highlights} from "@/pages/StatsPage/widgets/Highlights";
import {MonthlyChart} from "@/pages/StatsPage/widgets/MonthlyChart";
import {useWatches} from "@/hooks/library";
import {useSession} from "@/hooks/auth/useSession";
import {hasSupabase} from "@/lib/env";
import {AccountRequired} from "@/widgets/AccountRequired";
import {monthlyMinutes, summarize, topGenres, watchTime, watchesInYear} from "@/helpers/stats";

const PERIOD = {
    YEAR: "year",
    ALL: "all",
} as const;
type Period = (typeof PERIOD)[keyof typeof PERIOD];

/** "Wrapped"-style numbers from the user's own diary: hours, months, genres and highlights. */
export const StatsPage = () => {
    const {t} = useTranslation("stats");
    const [period, setPeriod] = useState<Period>(PERIOD.YEAR);
    const {watches} = useWatches();
    const {session, isLoading: isSessionLoading} = useSession();
    const isGuest = hasSupabase && !session && !isSessionLoading;
    const year = new Date().getFullYear();

    const scoped = useMemo(() => watchesInYear(watches, period === PERIOD.YEAR ? year : null), [watches, period, year]);
    const summary = useMemo(() => summarize(scoped), [scoped]);
    const months = useMemo(() => monthlyMinutes(watches, year), [watches, year]);
    const genres = useMemo(() => topGenres(scoped), [scoped]);

    if (isGuest) {
        return (
            <Screen>
                <PageTitle title={t("title")}/>
                <AccountRequired description={t("guestDescription")}/>
            </Screen>
        );
    }

    if (!watches.length) {
        return (
            <Screen>
                <PageTitle title={t("title")}/>
                <EmptyState title={t("empty.title")} description={t("empty.description")}/>
            </Screen>
        );
    }

    const {hours, days} = watchTime(summary.minutes);
    const periods = Object.values(PERIOD).map((value) => ({value, label: t(`period.${value}`)}));
    const tiles = [
        {value: String(summary.movies), label: t("tiles.movies")},
        {value: summary.episodes.toLocaleString(), label: t("tiles.episodes")},
        {value: String(summary.series), label: t("tiles.series")},
        {value: summary.averageRating?.toFixed(1) ?? "—", label: t("tiles.averageRating")},
    ];

    return (
        <Screen>
            <View className="gap-2">
                <Text className="font-sans-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    {period === PERIOD.YEAR ? t("yourYear", {year}) : t("allTime")}
                </Text>
                <Text role="heading" aria-level={1} className="font-serif text-[52px] leading-[50px] text-foreground">
                    {t("hours", {count: hours})}
                    {"\n"}
                    <Text className="font-serif-italic text-brand">{t("screenTime")}</Text>
                </Text>
                {/* "About 0.1 days" reads oddly; the line only adds something from a full day up. */}
                {days >= 1 && <Text className="font-sans text-sm text-muted-foreground">{t("days", {days})}</Text>}
            </View>

            <SegmentedControl options={periods} value={period} onChange={setPeriod} label={t("title")}/>

            {period === PERIOD.YEAR && <MonthlyChart year={year} minutes={months}/>}

            <View className="flex-row flex-wrap gap-2.5">
                {tiles.map((tile) => (
                    <View key={tile.label} className="grow basis-[45%] gap-1 rounded-2xl bg-surface p-3.5">
                        <Text className="font-serif text-[32px] leading-[34px] text-foreground">{tile.value}</Text>
                        <Text className="font-sans text-xs text-muted-foreground">{tile.label}</Text>
                    </View>
                ))}
            </View>

            <GenreBars genres={genres}/>
            <Highlights watches={scoped}/>
        </Screen>
    );
};
