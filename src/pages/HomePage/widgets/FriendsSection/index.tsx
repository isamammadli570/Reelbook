import {Text, View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {UserPlus} from "lucide-react-native";
import {PressScale} from "@/components/motion/PressScale";
import {Button} from "@/components/ui/button";
import {Skeleton} from "@/components/ui/skeleton";
import {ActivityRow} from "@/widgets/ActivityRow";
import {EmptyState} from "@/widgets/EmptyState";
import {Section} from "@/widgets/Section";
import {useFeed, useSelfId} from "@/hooks/social";
import {ROUTES} from "@/constants/routes";

/** The latest few things friends did; the whole feed is a tap away. */
const SHOWN = 3;

/**
 * "What friends are watching" on the home page. Signed out it is not shown at all; with nobody followed yet it
 * invites the user to find friends instead.
 */
export const FriendsSection = () => {
    const {t} = useTranslation("social");
    const selfId = useSelfId();
    const feed = useFeed();
    if (!selfId || feed.isError) return null;

    const events = feed.data?.pages[0]?.slice(0, SHOWN) ?? [];
    const seeAll = events.length > 0 && (
        <PressScale onPress={() => router.push(ROUTES.FEED)} hitSlop={8} scaleTo={0.95}>
            <Text className="font-sans-medium text-[13px] text-brand">{t("feed.seeAll")}</Text>
        </PressScale>
    );

    const renderBody = () => {
        if (feed.isLoading) return <Skeleton className="h-[120px] w-full rounded-2xl"/>;
        if (!events.length) {
            return (
                <EmptyState
                    title={t("feed.emptyTitle")}
                    description={t("feed.emptyHint")}
                    action={<Button variant="brand" icon={UserPlus} label={t("feed.findFriends")} onPress={() => router.push(ROUTES.FRIENDS)}/>}
                />
            );
        }
        return (
            <View className="gap-3">
                {events.map((event) => <ActivityRow key={`${event.userId}:${event.eventKey}`} event={event}/>)}
            </View>
        );
    };

    return (
        <Section title={t("feed.homeTitle")} aside={seeAll}>
            {renderBody()}
        </Section>
    );
};
