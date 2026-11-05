import {Pressable, Text, View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {Image} from "@/components/ui/image";
import {Section} from "@/widgets/Section";
import {useDateFormat} from "@/hooks/useDateFormat";
import {longestMarathon, topSeries, watchTime, type Watch} from "@/helpers/stats";
import {imageUrl} from "@/helpers/media";
import {buildRoute} from "@/constants/routes";
import {IMAGE_SIZE} from "@/constants/other";
import type {LibraryItem} from "@/api/library.api";

type HighlightCardProps = {
    item: LibraryItem;
    label: string;
    value: string;
};

const HighlightCard = ({item, label, value}: HighlightCardProps) => {
    const poster = imageUrl(item.posterPath, IMAGE_SIZE.POSTER);

    return (
        <Pressable onPress={() => router.push(buildRoute.series(item.id))} className="flex-row items-center gap-3.5 rounded-2xl bg-surface p-2.5">
            <View className="h-[72px] w-12 overflow-hidden rounded-lg bg-surface-raised">
                {poster && <Image source={poster} className="h-full w-full" contentFit="cover"/>}
            </View>
            <View className="min-w-0 flex-1 gap-0.5">
                <Text className="font-sans-semibold text-[11px] uppercase tracking-wider text-brand">{label}</Text>
                <Text className="font-sans-medium text-base text-foreground" numberOfLines={1}>{item.title}</Text>
                <Text className="font-sans text-xs text-muted-foreground" numberOfLines={1}>{value}</Text>
            </View>
        </Pressable>
    );
};

type HighlightsProps = {watches: Watch[]};

/** The most watched series and the longest single-day marathon in the chosen period. */
export const Highlights = ({watches}: HighlightsProps) => {
    const {t} = useTranslation("stats");
    const {dayMonth} = useDateFormat();
    const top = topSeries(watches);
    const marathon = longestMarathon(watches);
    if (!top && !marathon) return null;

    return (
        <Section title={t("highlights")}>
            <View className="gap-2.5">
                {top && <HighlightCard item={top.item} label={t("topSeries")} value={t("topSeriesValue", {episodes: top.episodes, hours: watchTime(top.minutes).hours})}/>}
                {marathon && (
                    <HighlightCard item={marathon.item} label={t("marathon")} value={t("marathonValue", {episodes: marathon.episodes, date: dayMonth(marathon.watchedAt)})}/>
                )}
            </View>
        </Section>
    );
};
