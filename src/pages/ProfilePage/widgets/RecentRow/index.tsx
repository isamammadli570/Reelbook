import {useMemo} from "react";
import {Text} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {Reveal} from "@/components/motion/Reveal";
import {PosterGrid} from "@/widgets/PosterGrid";
import {SeriesProgressLine} from "@/widgets/SeriesProgressLine";
import {RowHeader} from "@/pages/ProfilePage/widgets/RowHeader";
import {recentTitles, watchRating} from "@/helpers/activity";
import {formatStars, itemKey, toMediaSummary} from "@/helpers/library";
import {buildRoute} from "@/constants/routes";
import {MEDIA_TYPE, SHELF_PREVIEW} from "@/constants/other";
import type {Watch} from "@/helpers/stats";

type RecentRowProps = {
    watches: Watch[];
    /** The full diary behind the row. */
    diaryHref: string;
    emptyText: string;
    index?: number;
};

/** The last four titles watched, movies and series mixed: stars under a movie, progress under a series. */
export const RecentRow = ({watches, diaryHref, emptyText, index = 0}: RecentRowProps) => {
    const {t} = useTranslation("profile");
    const recent = useMemo(() => recentTitles(watches, SHELF_PREVIEW), [watches]);
    const byKey = useMemo(() => new Map(recent.map((watch) => [itemKey(watch.item.mediaType, watch.item.id), watch])), [recent]);

    return (
        <Reveal index={index} variant="rise" className="gap-3">
            <RowHeader title={t("recent.title")} aside={t("recent.diary")} onPress={recent.length ? () => router.push(diaryHref) : undefined}/>
            {recent.length ? (
                <PosterGrid
                    items={recent.map((watch) => toMediaSummary(watch.item))}
                    isCompact
                    onPress={(media) => router.push(buildRoute.media(media))}
                    renderFooter={(media) => {
                        const watch = byKey.get(itemKey(media.media_type, media.id));
                        if (!watch) return null;
                        if (watch.kind === MEDIA_TYPE.TV) return <SeriesProgressLine item={watch.item}/>;
                        const rating = watchRating(watch);
                        return rating === null ? null : <Text className="font-sans text-[11px] text-brand">{formatStars(rating)}</Text>;
                    }}
                />
            ) : (
                <Text className="font-sans text-sm leading-5 text-muted-foreground">{emptyText}</Text>
            )}
        </Reveal>
    );
};
