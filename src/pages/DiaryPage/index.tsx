import {useMemo, useState} from "react";
import {Text, View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {Ellipsis} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {PressScale} from "@/components/motion/PressScale";
import {Reveal} from "@/components/motion/Reveal";
import {Image} from "@/components/ui/image";
import {BackButton} from "@/widgets/BackButton";
import {EmptyState} from "@/widgets/EmptyState";
import {ListScreen} from "@/widgets/ListScreen";
import {DiaryActions} from "@/pages/DiaryPage/widgets/DiaryActions";
import {PageTitle} from "@/widgets/PageTitle";
import {ProfileSourceState} from "@/widgets/ProfileSourceState";
import {useProfileSource} from "@/hooks/social";
import {useDateFormat} from "@/hooks/useDateFormat";
import {diaryRows, watchRating} from "@/helpers/activity";
import {formatStars} from "@/helpers/library";
import {imageUrl} from "@/helpers/media";
import {collectWatches} from "@/helpers/stats";
import {haptics} from "@/lib/haptics";
import {buildRoute} from "@/constants/routes";
import {IMAGE_SIZE, MEDIA_TYPE} from "@/constants/other";
import type {Watch} from "@/helpers/stats";

/**
 * The day only shows on the first viewing of that day, so a busy day reads as one block. Without
 * `onOpenActions` (someone else's diary) the row only opens the title.
 */
type DiaryRowProps = {watch: Watch; isFirstOfDay: boolean; onOpenActions?: (watch: Watch) => void};

/**
 * One viewing: the day, a small poster, the title and its stars or episode. A tap opens the title;
 * the ⋯ button or a long press opens what can be done to this viewing.
 */
const DiaryRow = ({watch, isFirstOfDay, onOpenActions}: DiaryRowProps) => {
    const {t} = useTranslation("details");
    const {dayNumber, weekdayShort} = useDateFormat();
    const muted = String(useCSSVariable("--color-muted-foreground"));
    const {item} = watch;
    const rating = watchRating(watch);
    const poster = imageUrl(item.posterPath, IMAGE_SIZE.PROFILE);
    const detail = watch.kind === MEDIA_TYPE.TV && watch.episode
        ? t("episodeCode", {season: watch.episode.season, episode: watch.episode.episode})
        : rating !== null ? formatStars(rating) : null;

    return (
        <PressScale
            role="link"
            aria-label={item.title}
            onPress={() => router.push(buildRoute.media({id: item.id, media_type: item.mediaType}))}
            onLongPress={onOpenActions ? () => {
                haptics.tap();
                onOpenActions(watch);
            } : undefined}
            delayLongPress={350}
            className="flex-row items-center gap-3.5 py-2"
        >
            <View className="w-9 items-center" style={{opacity: isFirstOfDay ? 1 : 0}} aria-hidden={!isFirstOfDay}>
                <Text className="font-serif text-[24px] leading-[26px] text-foreground">{dayNumber(watch.watchedAt)}</Text>
                <Text className="font-sans text-[11px] text-muted-foreground">{weekdayShort(new Date(watch.watchedAt))}</Text>
            </View>
            <View className="h-[60px] w-10 overflow-hidden rounded-md border border-border bg-surface">
                {poster && <Image source={poster} className="h-full w-full" contentFit="cover"/>}
            </View>
            <View className="min-w-0 flex-1 gap-0.5">
                <Text className="font-sans-semibold text-[15px] text-foreground" numberOfLines={1}>{item.title}</Text>
                {detail ? <Text className={watch.kind === MEDIA_TYPE.TV ? "font-sans text-[13px] text-muted-foreground" : "font-sans text-[13px] text-brand"}>{detail}</Text> : null}
            </View>
            {onOpenActions && <PressScale
                onPress={() => onOpenActions(watch)}
                aria-label={t("diary.actions", {title: item.title})}
                hitSlop={6}
                className="h-10 w-10 items-center justify-center rounded-full"
            >
                <Ellipsis size={20} strokeWidth={2} color={muted}/>
            </PressScale>}
        </PressScale>
    );
};

/**
 * Everything watched, newest first, a month at a time: the full history behind "Recently watched". Your own,
 * where each viewing can be changed, or someone else's, read-only, under `/user/[username]`.
 * A virtual list, so years of viewings scroll as smoothly as a week.
 */
export const DiaryPage = () => {
    const {t} = useTranslation("profile");
    const {monthYear} = useDateFormat();
    const source = useProfileSource();
    const {library, isOwn} = source;
    const rows = useMemo(() => diaryRows(collectWatches(library)), [library]);
    const [selected, setSelected] = useState<Watch | null>(null);

    if (source.status !== "ready") return <ProfileSourceState source={source} guestDescription={t("guestDescription")}/>;

    return (
        <ListScreen
            header={(
                <>
                    <BackButton className="self-start"/>
                    <PageTitle title={t("recent.diaryTitle")} eyebrow={isOwn || !source.username ? undefined : `@${source.username}`}/>
                </>
            )}
            rows={rows}
            rowKey={(row) => row.key}
            rowGap={0}
            empty={<EmptyState title={isOwn ? t("recent.empty") : t("others.empty")}/>}
            renderRow={(row) => row.kind === "month"
                ? (
                    <Reveal variant="fade" className="pb-1 pt-4">
                        <Text role="heading" className="font-serif text-[26px] text-foreground">{monthYear(`${row.month}-01`) ?? row.month}</Text>
                    </Reveal>
                )
                : <DiaryRow watch={row.watch} isFirstOfDay={row.isFirstOfDay} onOpenActions={isOwn ? setSelected : undefined}/>}
        >
            {isOwn && <DiaryActions watch={selected} onClose={() => setSelected(null)}/>}
        </ListScreen>
    );
};
