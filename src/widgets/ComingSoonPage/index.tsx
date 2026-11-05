import {useTranslation} from "react-i18next";
import {EmptyState} from "@/widgets/EmptyState";
import {PageTitle} from "@/widgets/PageTitle";
import {Screen} from "@/widgets/Screen";

type ComingSoonPageProps = {title: string};

/** Stands in for a tab whose page is built in a later stage, so navigation already works end to end. */
export const ComingSoonPage = ({title}: ComingSoonPageProps) => {
    const {t} = useTranslation();

    return (
        <Screen>
            <PageTitle title={title}/>
            <EmptyState title={t("comingSoon.title")} description={t("comingSoon.description")}/>
        </Screen>
    );
};
