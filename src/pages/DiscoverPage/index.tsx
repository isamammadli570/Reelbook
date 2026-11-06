import {useMemo, useState} from "react";
import {router} from "expo-router";
import {View} from "react-native";
import {useTranslation} from "react-i18next";
import {SegmentedControl} from "@/components/ui/segmented-control";
import {CastRow} from "@/widgets/CastRow";
import {EmptyState} from "@/widgets/EmptyState";
import {PageTitle} from "@/widgets/PageTitle";
import {PosterGrid} from "@/widgets/PosterGrid";
import {PosterRail} from "@/widgets/PosterRail";
import {QueryErrorState} from "@/widgets/QueryErrorState";
import {Screen} from "@/widgets/Screen";
import {Section} from "@/widgets/Section";
import {GenreTiles} from "@/pages/DiscoverPage/widgets/GenreTiles";
import {SearchField} from "@/pages/DiscoverPage/widgets/SearchField";
import {FilterButton, FilterChips} from "@/pages/DiscoverPage/widgets/FilterBar";
import {FilterSheet} from "@/pages/DiscoverPage/widgets/FilterSheet";
import {useAiringToday, useDiscoverTitles, useNewReleases, useSearch, useStreamingServices, useTopRated, useUpcoming} from "@/hooks/discover";
import {useDebouncedValue} from "@/hooks/useDebouncedValue";
import {useDepartmentLabel} from "@/hooks/useDepartmentLabel";
import {activeFilterCount, EMPTY_FILTERS, type DiscoverFilters} from "@/helpers/discover";
import {buildRoute} from "@/constants/routes";
import {MEDIA_FILTER, SEARCH_DEBOUNCE_MS, type MediaFilter} from "@/constants/other";
import type {GenreTile} from "@/constants/genres";
import type {MediaSummary} from "@/api/media.api";

const MIN_SEARCH_LENGTH = 2;

const openMedia = (media: MediaSummary) => router.push(buildRoute.media(media));

/**
 * Find anything by name, or browse: by genre and filters (service, language, era, rating, order), or through
 * the lists of what is coming, on today, rated highest and just out.
 */
export const DiscoverPage = () => {
    const {t} = useTranslation(["discover", "common"]);
    const departmentLabel = useDepartmentLabel();
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<MediaFilter>(MEDIA_FILTER.ALL);
    const [genre, setGenre] = useState<GenreTile | null>(null);
    const [filters, setFilters] = useState<DiscoverFilters>(EMPTY_FILTERS);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const searchTerm = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
    const isSearching = searchTerm.length >= MIN_SEARCH_LENGTH;
    const search = useSearch(searchTerm);
    const releases = useNewReleases(filter);
    const streaming = useStreamingServices(filter);
    const services = streaming.data?.services ?? [];
    const isBrowsing = genre !== null || activeFilterCount(filters) > 0;
    const discovered = useDiscoverTitles(filter, genre, filters, streaming.data?.region ?? "US");
    const upcoming = useUpcoming(filter !== MEDIA_FILTER.TV && !isBrowsing);
    const airingToday = useAiringToday(filter !== MEDIA_FILTER.MOVIE && !isBrowsing);
    const topRated = useTopRated(filter);

    const searchResults = useMemo(
        () => (search.data?.media ?? []).filter((media) => filter === MEDIA_FILTER.ALL || media.media_type === filter),
        [search.data, filter],
    );
    // People are neither movies nor series, so they only show under "All".
    const people = useMemo(
        () => (filter === MEDIA_FILTER.ALL ? search.data?.people ?? [] : []).map((person) => ({...person, character: departmentLabel(person.known_for_department)})),
        [search.data, filter, departmentLabel],
    );

    // Services differ between movies and series; switching kind lets go of ones the new kind may not list.
    const changeFilter = (next: MediaFilter) => {
        setFilter(next);
        if (filters.providerIds.length) setFilters({...filters, providerIds: []});
    };

    const options = Object.values(MEDIA_FILTER).map((value) => ({value, label: t(`common:mediaFilter.${value}`)}));

    const renderContent = () => {
        if (isSearching) {
            if (search.isError) return <QueryErrorState error={search.error} onRetry={() => void search.refetch()}/>;
            if (!search.isLoading && !searchResults.length && !people.length) return <EmptyState title={t("noResults")}/>;
            return (
                <>
                    {people.length > 0 && (
                        <Section title={t("people")}>
                            <CastRow cast={people}/>
                        </Section>
                    )}
                    {(search.isLoading || searchResults.length > 0) && (
                        <Section title={t("results")} index={1}>
                            <PosterGrid items={searchResults} isLoading={search.isLoading} onPress={openMedia}/>
                        </Section>
                    )}
                </>
            );
        }

        if (isBrowsing) {
            if (discovered.isError) return <QueryErrorState error={discovered.error} onRetry={() => void discovered.refetch()}/>;
            if (!discovered.isLoading && !discovered.data?.length) return <EmptyState title={t("filters.noResults")} description={t("filters.noResultsHint")}/>;
            return (
                // Keyed by what is asked, so new results rise in rather than swap in place.
                <Section key={JSON.stringify([genre?.key, filters, filter])} title={genre ? t(`genres.${genre.key}`) : t("results")}>
                    <PosterGrid items={discovered.data ?? []} isLoading={discovered.isLoading} onPress={openMedia}/>
                </Section>
            );
        }

        if (releases.isError) return <QueryErrorState error={releases.error} onRetry={() => void releases.refetch()}/>;
        return (
            <>
                {filter !== MEDIA_FILTER.TV && <PosterRail title={t("lists.upcoming")} items={upcoming.data} isLoading={upcoming.isLoading} index={0}/>}
                {filter !== MEDIA_FILTER.MOVIE && <PosterRail title={t("lists.airingToday")} items={airingToday.data} isLoading={airingToday.isLoading} index={1}/>}
                <PosterRail title={t("lists.topRated")} items={topRated.data} isLoading={topRated.isLoading} index={2}/>
                <Section title={t("newReleases")} index={3}>
                    <PosterGrid items={releases.data ?? []} isLoading={releases.isLoading} onPress={openMedia}/>
                </Section>
            </>
        );
    };

    return (
        <Screen>
            <PageTitle title={t("title")}/>
            <SearchField value={query} onChangeText={setQuery} label={t("searchLabel")} placeholder={t("searchPlaceholder")}/>
            <View className="flex-row items-center gap-2">
                <SegmentedControl options={options} value={filter} onChange={changeFilter} label={t("title")} className="flex-1"/>
                {!isSearching && <FilterButton filters={filters} onOpen={() => setIsFilterOpen(true)}/>}
            </View>
            {!isSearching && <GenreTiles filter={filter} selected={genre} onSelect={setGenre}/>}
            {!isSearching && <FilterChips filters={filters} onChange={setFilters} services={services}/>}
            {renderContent()}
            <FilterSheet isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} filters={filters} onChange={setFilters} services={services}/>
        </Screen>
    );
};
