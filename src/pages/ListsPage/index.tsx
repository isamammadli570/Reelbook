import {useMemo} from "react";
import {useTranslation} from "react-i18next";
import {BackButton} from "@/widgets/BackButton";
import {CreateListButton} from "@/widgets/CreateListButton";
import {EmptyState} from "@/widgets/EmptyState";
import {ListGrid} from "@/widgets/ListGrid";
import {PageTitle} from "@/widgets/PageTitle";
import {ProfileSourceState} from "@/widgets/ProfileSourceState";
import {Screen} from "@/widgets/Screen";
import {useProfileSource} from "@/hooks/social";
import {sortedLists} from "@/helpers/lists";
import {ownerEyebrow} from "@/helpers/social";

/** Every list someone has made, two to a row; on your own, with a button to start a new one. */
export const ListsPage = () => {
    const {t} = useTranslation("lists");
    const {t: tProfile} = useTranslation("profile");
    const source = useProfileSource();
    const {isOwn, routes} = source;
    const lists = useMemo(() => sortedLists(source.lists), [source.lists]);

    if (source.status !== "ready") return <ProfileSourceState source={source} guestDescription={t("guestDescription")}/>;

    return (
        <Screen>
            <BackButton className="self-start"/>
            <PageTitle title={t("title")} eyebrow={ownerEyebrow(source.username, isOwn, t("listCount", {count: lists.length}))}/>
            {isOwn && <CreateListButton/>}
            {lists.length
                ? <ListGrid lists={lists} listHref={isOwn ? undefined : routes.list}/>
                : isOwn ? <EmptyState title={t("emptyTitle")} description={t("empty")}/> : <EmptyState title={tProfile("others.empty")}/>}
        </Screen>
    );
};
