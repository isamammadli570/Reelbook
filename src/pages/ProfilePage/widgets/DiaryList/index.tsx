import {useMemo} from "react";
import {Pressable, Text, View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {Image} from "@/components/ui/image";
import {EmptyState} from "@/widgets/EmptyState";
import {useDateFormat} from "@/hooks/useDateFormat";
import {formatStars} from "@/helpers/library";
import {imageUrl} from "@/helpers/media";
import {cn} from "@/lib/utils";
import {buildRoute} from "@/constants/routes";
import {IMAGE_SIZE, MEDIA_TYPE} from "@/constants/other";
import type {Watch} from "@/helpers/stats";

const DIARY_LIMIT = 40;

type DiaryListProps = {watches: Watch[]};

/** The latest viewings grouped by month, Letterboxd-diary style. */
export const DiaryList = ({watches}: DiaryListProps) => {
    const {t} = useTranslation(["profile", "details", "common"]);
    const {monthYear, dayNumber} = useDateFormat();

    const months = useMemo(() => {
        const groups: {label: string; watches: Watch[]}[] = [];
        watches.slice(0, DIARY_LIMIT).forEach((watch) => {
            const label = monthYear(watch.watchedAt) ?? "";
            const last = groups.at(-1);
            if (last?.label === label) last.watches.push(watch);
            else groups.push({label, watches: [watch]});
        });
        return groups;
    }, [watches, monthYear]);

    if (!watches.length) return <EmptyState title={t("diaryEmpty.title")} description={t("diaryEmpty.description")}/>;

    return (
        <View className="gap-5">
            {months.map((month) => (
                <View key={month.label} className="gap-1">
                    <Text className="pb-1 font-sans-semibold text-xs uppercase tracking-wider text-muted-foreground">{month.label}</Text>
                    {month.watches.map((watch, index) => {
                        const {item, episode} = watch;
                        const poster = imageUrl(item.posterPath, IMAGE_SIZE.POSTER);
                        const isMovie = item.mediaType === MEDIA_TYPE.MOVIE;
                        const subtitle = episode
                            ? t("details:episodeCode", {season: episode.season, episode: episode.episode})
                            : [t(`common:mediaType.${item.mediaType}`), item.year].filter(Boolean).join(" · ");
                        return (
                            <Pressable
                                key={`${item.mediaType}-${item.id}-${watch.watchedAt}-${index}`}
                                onPress={() => router.push(isMovie ? buildRoute.movie(item.id) : buildRoute.series(item.id))}
                                className={cn("flex-row items-center gap-3.5 py-2", index > 0 && "border-t border-border")}
                            >
                                <Text className="w-9 text-center font-serif text-[28px] leading-[30px] text-foreground">{dayNumber(watch.watchedAt)}</Text>
                                <View className="h-[60px] w-10 overflow-hidden rounded-md bg-surface">
                                    {poster && <Image source={poster} className="h-full w-full" contentFit="cover"/>}
                                </View>
                                <View className="min-w-0 flex-1 gap-0.5">
                                    <Text className="font-sans-medium text-sm text-foreground" numberOfLines={1}>{item.title}</Text>
                                    <Text className="font-sans text-xs text-muted-foreground" numberOfLines={1}>{subtitle}</Text>
                                </View>
                                {item.rating !== null && <Text className="font-sans text-[13px] text-brand">{formatStars(item.rating)}</Text>}
                            </Pressable>
                        );
                    })}
                </View>
            ))}
        </View>
    );
};
