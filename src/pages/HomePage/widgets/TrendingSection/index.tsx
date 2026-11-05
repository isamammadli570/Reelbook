import {useState} from "react";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {SegmentedControl} from "@/components/ui/segmented-control";
import {EmptyState} from "@/widgets/EmptyState";
import {PosterGrid} from "@/widgets/PosterGrid";
import {QueryErrorState} from "@/widgets/QueryErrorState";
import {Section} from "@/widgets/Section";
import {useGetTrending} from "@/hooks/media";
import {hasTmdbToken} from "@/lib/env";
import {MEDIA_FILTER, POSTER_COLUMNS, type MediaFilter} from "@/constants/other";
import {buildRoute} from "@/constants/routes";

const TRENDING_LIMIT = POSTER_COLUMNS * 2;

/** This week's trending titles, filterable by movies or series. */
export const TrendingSection = () => {
    const {t} = useTranslation(["home", "common"]);
    const [filter, setFilter] = useState<MediaFilter>(MEDIA_FILTER.ALL);
    const {items, isLoading, isError, error, refetch} = useGetTrending(filter);

    const options = Object.values(MEDIA_FILTER).map((value) => ({value, label: t(`common:mediaFilter.${value}`)}));

    const renderContent = () => {
        if (!hasTmdbToken) return <EmptyState title={t("common:missingToken.title")} description={t("common:missingToken.description")}/>;
        if (isError) return <QueryErrorState error={error} onRetry={() => void refetch()}/>;
        return (
            <PosterGrid
                items={items.slice(0, TRENDING_LIMIT)}
                isLoading={isLoading}
                placeholderCount={TRENDING_LIMIT}
                isRanked
                onPress={(media) => router.push(buildRoute.media(media))}
            />
        );
    };

    return (
        <>
            <SegmentedControl options={options} value={filter} onChange={setFilter} label={t("home:trending")}/>
            <Section title={t("home:trending")}>{renderContent()}</Section>
        </>
    );
};
