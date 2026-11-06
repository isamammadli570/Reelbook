import {ActivityIndicator} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {UserPlus} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {Button} from "@/components/ui/button";
import {AccountRequired} from "@/widgets/AccountRequired";
import {ActivityRow} from "@/widgets/ActivityRow";
import {BackButton} from "@/widgets/BackButton";
import {EmptyState} from "@/widgets/EmptyState";
import {ListScreen} from "@/widgets/ListScreen";
import {PageTitle} from "@/widgets/PageTitle";
import {QueryErrorState} from "@/widgets/QueryErrorState";
import {Screen} from "@/widgets/Screen";
import {useFeed, useSelfId} from "@/hooks/social";
import {ROUTES} from "@/constants/routes";

/** Everything the people you follow watched, rated and reviewed, newest first, loading more as you scroll. */
export const FeedPage = () => {
    const {t} = useTranslation("social");
    const muted = String(useCSSVariable("--color-muted-foreground"));
    const selfId = useSelfId();
    const feed = useFeed();
    const events = feed.data?.pages.flat() ?? [];

    if (!selfId) {
        return (
            <Screen>
                <BackButton className="self-start"/>
                <PageTitle title={t("feed.title")}/>
                <AccountRequired description={t("friends.guest")}/>
            </Screen>
        );
    }

    const renderEmpty = () => {
        if (feed.isError) return <QueryErrorState error={feed.error} onRetry={() => void feed.refetch()}/>;
        if (feed.isLoading) return <ActivityIndicator color={muted}/>;
        return (
            <EmptyState
                title={t("feed.emptyTitle")}
                description={t("feed.emptyHint")}
                action={<Button variant="brand" icon={UserPlus} label={t("feed.findFriends")} onPress={() => router.push(ROUTES.FRIENDS)}/>}
            />
        );
    };

    return (
        <ListScreen
            header={(
                <>
                    <BackButton className="self-start"/>
                    <PageTitle title={t("feed.title")} eyebrow={t("feed.eyebrow")}/>
                </>
            )}
            rows={events}
            rowKey={(event) => `${event.userId}:${event.eventKey}`}
            rowGap={12}
            renderRow={(event) => <ActivityRow event={event}/>}
            empty={renderEmpty()}
            onEndReached={() => {
                if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage();
            }}
            footer={feed.isFetchingNextPage ? <ActivityIndicator className="mt-4" color={muted}/> : null}
        />
    );
};
