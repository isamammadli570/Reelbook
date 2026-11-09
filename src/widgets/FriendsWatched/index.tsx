import {ScrollView, Text, View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {PressScale} from "@/components/motion/PressScale";
import {Skeleton} from "@/components/ui/skeleton";
import {Avatar} from "@/widgets/Avatar";
import {Section} from "@/widgets/Section";
import {useFriendsOnTitle, useSelfId} from "@/hooks/social";
import {useDateFormat} from "@/hooks/useDateFormat";
import {formatStars} from "@/helpers/library";
import {relativeTime, type FriendOnTitle} from "@/helpers/social";
import {buildRoute} from "@/constants/routes";
import {DEFAULT_AVATAR_COLOR, type MediaType} from "@/constants/other";
import type {FeedEvent} from "@/api/social.api";

type FriendsWatchedProps = {
    mediaType: MediaType;
    id: number;
};

/** One friend: who, when, the stars they gave and the start of their review. Opens their page. */
const FriendCard = ({friend}: {friend: FriendOnTitle<FeedEvent>}) => {
    const {t} = useTranslation("social");
    const {shortDate} = useDateFormat();
    const author = friend.latest.author;
    const name = author?.name || (author?.username ? `@${author.username}` : t("someone"));
    const ago = relativeTime(friend.happenedAt, new Date());
    const when = ago.unit === "date" ? shortDate(friend.happenedAt) ?? "" : t(`time.${ago.unit}`, {count: ago.count});
    const open = () => author?.username && router.push(buildRoute.user(author.username));

    return (
        <PressScale onPress={open} scaleTo={0.97} role="link" aria-label={name} className="w-[172px] gap-2 rounded-2xl bg-surface p-3">
            <View className="flex-row items-center gap-2">
                <Avatar name={author?.name || author?.username || name} color={author?.avatarColor ?? DEFAULT_AVATAR_COLOR} photoUrl={author?.avatarUrl} size={32}/>
                <View className="min-w-0 flex-1">
                    <Text className="font-sans-semibold text-[13px] text-foreground" numberOfLines={1}>{name}</Text>
                    <Text className="font-sans text-[11px] text-subtle-foreground" numberOfLines={1}>{when}</Text>
                </View>
            </View>
            {friend.rating !== null ? <Text className="font-sans text-[15px] text-brand" aria-label={t("stars", {count: friend.rating})}>{formatStars(friend.rating)}</Text> : null}
            {friend.review ? <Text className="font-sans text-[12px] leading-[17px] text-muted-foreground" numberOfLines={3}>{friend.review}</Text> : null}
        </PressScale>
    );
};

/**
 * "Friends who watched this" on a film or series page: one card per person you follow who watched, rated or
 * reviewed the title. Nothing shows signed out, with nobody followed, or when none of them did.
 */
export const FriendsWatched = ({mediaType, id}: FriendsWatchedProps) => {
    const {t} = useTranslation("social");
    const selfId = useSelfId();
    const {data: friends, isLoading, isError} = useFriendsOnTitle(mediaType, id);
    if (!selfId || isError) return null;
    if (!isLoading && !friends?.length) return null;

    return (
        <Section title={t(`onTitle.${mediaType}`)} aside={friends ? <Text className="font-sans text-[13px] text-muted-foreground">{friends.length}</Text> : null}>
            {isLoading || !friends ? (
                <Skeleton className="h-[96px] w-full rounded-2xl"/>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5" contentContainerClassName="gap-3 px-5">
                    {friends.map((friend) => <FriendCard key={friend.userId} friend={friend}/>)}
                </ScrollView>
            )}
        </Section>
    );
};
