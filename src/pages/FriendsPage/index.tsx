import {useState} from "react";
import {ActivityIndicator, View} from "react-native";
import {useTranslation} from "react-i18next";
import {useCSSVariable} from "uniwind";
import {Reveal} from "@/components/motion/Reveal";
import {SegmentedControl} from "@/components/ui/segmented-control";
import {AccountRequired} from "@/widgets/AccountRequired";
import {BackButton} from "@/widgets/BackButton";
import {EmptyState} from "@/widgets/EmptyState";
import {PageTitle} from "@/widgets/PageTitle";
import {QueryErrorState} from "@/widgets/QueryErrorState";
import {Screen} from "@/widgets/Screen";
import {SearchField} from "@/widgets/SearchField";
import {UserRow} from "@/widgets/UserRow";
import {useFollowList, useSelfId, useUserSearch} from "@/hooks/social";
import type {PublicProfile} from "@/api/social.api";

type Tab = "following" | "followers";

const UserList = ({users}: {users: PublicProfile[]}) => (
    <View className="gap-4">
        {users.map((user, index) => (
            <Reveal key={user.userId} variant="rise" index={index}>
                <UserRow user={user}/>
            </Reveal>
        ))}
    </View>
);

/** Find people by @username or name and follow them; below, who you follow and who follows you. */
export const FriendsPage = () => {
    const {t} = useTranslation("social");
    const muted = String(useCSSVariable("--color-muted-foreground"));
    const selfId = useSelfId();
    const [query, setQuery] = useState("");
    const [tab, setTab] = useState<Tab>("following");
    const search = useUserSearch(query);
    const list = useFollowList(selfId, tab);

    if (!selfId) {
        return (
            <Screen>
                <BackButton className="self-start"/>
                <PageTitle title={t("friends.title")}/>
                <AccountRequired description={t("friends.guest")}/>
            </Screen>
        );
    }

    const renderSearch = () => {
        if (search.isError) return <QueryErrorState error={search.error} onRetry={() => void search.refetch()}/>;
        if (search.isLoading) return <ActivityIndicator color={muted}/>;
        if (!search.data?.length) return <EmptyState title={t("friends.noResults")} description={t("friends.noResultsHint")}/>;
        return <UserList users={search.data}/>;
    };

    const renderList = () => {
        if (list.isError) return <QueryErrorState error={list.error} onRetry={() => void list.refetch()}/>;
        if (list.isLoading) return <ActivityIndicator color={muted}/>;
        if (!list.data?.length) {
            return <EmptyState title={t(`friends.empty.${tab}`)} description={tab === "following" ? t("friends.emptyHint") : undefined}/>;
        }
        return <UserList users={list.data}/>;
    };

    const tabs = [
        {value: "following" as const, label: t("friends.tabs.following")},
        {value: "followers" as const, label: t("friends.tabs.followers")},
    ];

    return (
        <Screen>
            <BackButton className="self-start"/>
            <PageTitle title={t("friends.title")} eyebrow={t("friends.eyebrow")}/>
            <SearchField value={query} onChangeText={setQuery} label={t("friends.searchLabel")} placeholder={t("friends.searchPlaceholder")}/>
            {search.isSearching ? renderSearch() : (
                <>
                    <SegmentedControl options={tabs} value={tab} onChange={setTab} label={t("friends.title")}/>
                    {renderList()}
                </>
            )}
        </Screen>
    );
};
