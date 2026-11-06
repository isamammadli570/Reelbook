import {useTranslation} from "react-i18next";
import {AccountRequired} from "@/widgets/AccountRequired";
import {BackButton} from "@/widgets/BackButton";
import {CreateListButton} from "@/widgets/CreateListButton";
import {EmptyState} from "@/widgets/EmptyState";
import {ListGrid} from "@/widgets/ListGrid";
import {PageTitle} from "@/widgets/PageTitle";
import {Screen} from "@/widgets/Screen";
import {useSession} from "@/hooks/auth/useSession";
import {useUserLists} from "@/hooks/lists";
import {hasSupabase} from "@/lib/env";

/** Every list the user has made, two to a row, with a button to start a new one. */
export const ListsPage = () => {
    const {t} = useTranslation("lists");
    const {session, isLoading: isSessionLoading} = useSession();
    const {lists} = useUserLists();

    if (hasSupabase && !session && !isSessionLoading) {
        return (
            <Screen>
                <BackButton className="self-start"/>
                <AccountRequired description={t("guestDescription")}/>
            </Screen>
        );
    }

    return (
        <Screen>
            <BackButton className="self-start"/>
            <PageTitle title={t("title")} eyebrow={t("listCount", {count: lists.length})}/>
            <CreateListButton/>
            {lists.length ? <ListGrid lists={lists}/> : <EmptyState title={t("emptyTitle")} description={t("empty")}/>}
        </Screen>
    );
};
