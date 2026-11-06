import {useMemo} from "react";
import {Text, View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {PressScale} from "@/components/motion/PressScale";
import {Image} from "@/components/ui/image";
import {AccountRequired} from "@/widgets/AccountRequired";
import {BackButton} from "@/widgets/BackButton";
import {EmptyState} from "@/widgets/EmptyState";
import {PageTitle} from "@/widgets/PageTitle";
import {Screen} from "@/widgets/Screen";
import {Section} from "@/widgets/Section";
import {useSession} from "@/hooks/auth/useSession";
import {useWatches} from "@/hooks/library";
import {useDateFormat} from "@/hooks/useDateFormat";
import {diaryMonths, watchRating} from "@/helpers/activity";
import {toIsoDay} from "@/helpers/calendar";
import {formatStars} from "@/helpers/library";
import {imageUrl} from "@/helpers/media";
import {hasSupabase} from "@/lib/env";
import {buildRoute} from "@/constants/routes";
import {IMAGE_SIZE, MEDIA_TYPE} from "@/constants/other";
import type {Watch} from "@/helpers/stats";

/** The day only shows on the first viewing of that day, so a busy day reads as one block. */
type DiaryRowProps = {watch: Watch; isFirstOfDay: boolean};

/** One viewing: the day, a small poster, the title and its stars or episode. */
const DiaryRow = ({watch, isFirstOfDay}: DiaryRowProps) => {
    const {t} = useTranslation("details");
    const {dayNumber, weekdayShort} = useDateFormat();
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
                {detail && <Text className={watch.kind === MEDIA_TYPE.TV ? "font-sans text-[13px] text-muted-foreground" : "font-sans text-[13px] text-brand"}>{detail}</Text>}
            </View>
        </PressScale>
    );
};

/** Everything watched, newest first, a month at a time: the full history behind "Recently watched". */
export const DiaryPage = () => {
    const {t} = useTranslation("profile");
    const {monthYear} = useDateFormat();
    const {session, isLoading: isSessionLoading} = useSession();
    const {watches} = useWatches();
    const months = useMemo(() => diaryMonths(watches), [watches]);

    const renderBody = () => {
        if (hasSupabase && !session && !isSessionLoading) return <AccountRequired description={t("guestDescription")}/>;
        if (!months.length) return <EmptyState title={t("recent.empty")}/>;
        return months.map((month, index) => (
            <Section key={month.key} title={monthYear(`${month.key}-01`) ?? month.key} index={Math.min(index, 4)}>
                <View>
                    {month.watches.map((watch, position) => (
                        <DiaryRow
                            key={`${watch.item.mediaType}-${watch.item.id}-${watch.watchedAt}`}
                            watch={watch}
                            isFirstOfDay={position === 0 || toIsoDay(new Date(month.watches[position - 1].watchedAt)) !== toIsoDay(new Date(watch.watchedAt))}
                        />
                    ))}
                </View>
            </Section>
        ));
    };

    return (
        <Screen>
            <BackButton className="self-start"/>
            <PageTitle title={t("recent.diaryTitle")}/>
            {renderBody()}
        </Screen>
    );
};
