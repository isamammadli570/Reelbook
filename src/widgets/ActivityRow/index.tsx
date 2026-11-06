import {Text, View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {PressScale} from "@/components/motion/PressScale";
import {Image} from "@/components/ui/image";
import {Avatar} from "@/widgets/Avatar";
import {useDateFormat} from "@/hooks/useDateFormat";
import {formatStars} from "@/helpers/library";
import {imageUrl} from "@/helpers/media";
import {ACTIVITY_KIND, relativeTime} from "@/helpers/social";
import {buildRoute} from "@/constants/routes";
import {IMAGE_SIZE} from "@/constants/other";
import type {FeedEvent} from "@/api/social.api";

type ActivityRowProps = {
    event: FeedEvent;
    /** On someone's own page their name is already the heading, so rows leave it out. */
    hasAuthor?: boolean;
};

/**
 * One thing a friend did: who and when on top, then the poster with the title, the stars they gave and, for a
 * review, its first lines. The person opens their page; the poster opens the title.
 */
export const ActivityRow = ({event, hasAuthor = true}: ActivityRowProps) => {
    const {t} = useTranslation("social");
    const {shortDate} = useDateFormat();
    const poster = imageUrl(event.posterPath, IMAGE_SIZE.POSTER);
    const author = event.author;
    const name = author?.name || (author?.username ? `@${author.username}` : t("someone"));
    const ago = relativeTime(event.happenedAt, new Date());
    const when = ago.unit === "date" ? shortDate(event.happenedAt) ?? "" : t(`time.${ago.unit}`, {count: ago.count});
    const action = event.kind === ACTIVITY_KIND.EPISODES
        ? t("did.episodes", {count: event.episodeCount ?? 1})
        : t(`did.${event.kind}`);
    const openTitle = () => router.push(buildRoute.media({id: event.mediaId, media_type: event.mediaType}));
    const openAuthor = () => author?.username && router.push(buildRoute.user(author.username));

    return (
        <View className="gap-2.5 rounded-2xl bg-surface p-3.5">
            <View className="flex-row items-center gap-2.5">
                {hasAuthor && author ? (
                    <PressScale onPress={openAuthor} scaleTo={0.94} aria-label={name}>
                        <Avatar name={author.name || author.username} color={author.avatarColor} photoUrl={author.avatarUrl} size={28}/>
                    </PressScale>
                ) : null}
                <Text className="min-w-0 flex-1 font-sans text-[13px] text-muted-foreground" numberOfLines={1}>
                    {hasAuthor ? <Text className="font-sans-semibold text-foreground" onPress={openAuthor}>{name} </Text> : null}
                    {action}
                </Text>
                <Text className="font-sans text-xs text-subtle-foreground">{when}</Text>
            </View>
            <PressScale onPress={openTitle} scaleTo={0.98} role="link" aria-label={event.title} className="flex-row gap-3">
                <View className="h-[84px] w-14 overflow-hidden rounded-lg border border-border bg-surface-raised">
                    {poster ? <Image source={poster} className="h-full w-full" contentFit="cover"/> : null}
                </View>
                <View className="min-w-0 flex-1 gap-1 py-0.5">
                    <Text className="font-serif text-[19px] leading-[22px] text-foreground" numberOfLines={2}>
                        {event.title}
                        {event.year ? <Text className="font-sans text-[13px] text-muted-foreground">{`  ${event.year}`}</Text> : null}
                    </Text>
                    {event.rating !== null ? <Text className="font-sans text-[15px] text-brand" aria-label={t("stars", {count: event.rating})}>{formatStars(event.rating)}</Text> : null}
                    {event.review ? <Text className="font-sans text-[13px] leading-[19px] text-muted-foreground" numberOfLines={3}>{event.review}</Text> : null}
                </View>
            </PressScale>
        </View>
    );
};
