import {useEffect} from "react";
import {ActivityIndicator, Text, View} from "react-native";
import {router, useLocalSearchParams} from "expo-router";
import {useTranslation} from "react-i18next";
import {useCSSVariable} from "uniwind";
import {Reveal} from "@/components/motion/Reveal";
import {ActivityRow} from "@/widgets/ActivityRow";
import {Avatar} from "@/widgets/Avatar";
import {BackButton} from "@/widgets/BackButton";
import {EmptyState} from "@/widgets/EmptyState";
import {FollowButton} from "@/widgets/FollowButton";
import {ListScreen} from "@/widgets/ListScreen";
import {QueryErrorState} from "@/widgets/QueryErrorState";
import {Screen} from "@/widgets/Screen";
import {useFollowCounts, useSelfId, useUserActivity, useUserProfile} from "@/hooks/social";
import {ROUTES} from "@/constants/routes";

/** Someone else's page: who they are, how many follow them, a follow button, and what they have been watching. */
export const UserPage = () => {
    const {username = ""} = useLocalSearchParams<{username: string}>();
    const {t} = useTranslation("social");
    const muted = String(useCSSVariable("--color-muted-foreground"));
    const selfId = useSelfId();
    const profile = useUserProfile(username);
    const user = profile.data;
    const counts = useFollowCounts(user?.userId);
    const activity = useUserActivity(user?.shareActivity ? user.userId : null);
    const events = activity.data?.pages.flat() ?? [];

    // Your own handle leads to your own profile, which shows all of this and more.
    useEffect(() => {
        if (user && user.userId === selfId) router.replace(ROUTES.PROFILE);
    }, [user, selfId]);

    if (profile.isLoading) {
        return (
            <Screen>
                <BackButton className="self-start"/>
                <ActivityIndicator color={muted}/>
            </Screen>
        );
    }
    if (profile.isError || !user) {
        return (
            <Screen>
                <BackButton className="self-start"/>
                {profile.isError
                    ? <QueryErrorState error={profile.error} onRetry={() => void profile.refetch()}/>
                    : <EmptyState title={t("user.notFound")} description={t("user.notFoundHint", {username})}/>}
            </Screen>
        );
    }

    const header = (
        <>
            <BackButton className="self-start"/>
            <Reveal variant="rise" className="items-center gap-3">
                <Avatar name={user.name || user.username} color={user.avatarColor} photoUrl={user.avatarUrl} size={96}/>
                <View className="items-center gap-0.5">
                    <Text role="heading" aria-level={1} className="text-center font-serif text-[32px] leading-[36px] text-foreground">
                        {user.name || `@${user.username}`}
                    </Text>
                    {user.name ? <Text className="font-sans text-sm text-muted-foreground">@{user.username}</Text> : null}
                </View>
                {user.bio ? <Text className="text-center font-sans text-[15px] leading-[22px] text-muted-foreground">{user.bio}</Text> : null}
                <Text className="font-sans text-[13px] text-muted-foreground">
                    {`${t("counts.followers", {count: counts.data?.followers ?? 0})}  ·  ${t("counts.following", {count: counts.data?.following ?? 0})}`}
                </Text>
                <FollowButton userId={user.userId} className="min-w-[160px]"/>
            </Reveal>
            <Text role="heading" className="font-serif text-[26px] text-foreground">{t("user.activity")}</Text>
        </>
    );

    const renderEmpty = () => {
        if (!user.shareActivity) return <EmptyState title={t("user.private")} description={t("user.privateHint")}/>;
        if (activity.isError) return <QueryErrorState error={activity.error} onRetry={() => void activity.refetch()}/>;
        if (activity.isLoading) return <ActivityIndicator color={muted}/>;
        return <EmptyState title={t("user.noActivity")}/>;
    };

    return (
        <ListScreen
            header={header}
            rows={events}
            rowKey={(event) => event.eventKey}
            rowGap={12}
            renderRow={(event) => <ActivityRow event={event} hasAuthor={false}/>}
            empty={renderEmpty()}
            onEndReached={() => {
                if (activity.hasNextPage && !activity.isFetchingNextPage) void activity.fetchNextPage();
            }}
            footer={activity.isFetchingNextPage ? <ActivityIndicator className="mt-4" color={muted}/> : null}
        />
    );
};
