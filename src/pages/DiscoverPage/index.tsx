import {useMemo, useState} from "react";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {SegmentedControl} from "@/components/ui/segmented-control";
import {CastRow} from "@/widgets/CastRow";
import {EmptyState} from "@/widgets/EmptyState";
import {PageTitle} from "@/widgets/PageTitle";
import {PosterGrid} from "@/widgets/PosterGrid";
import {QueryErrorState} from "@/widgets/QueryErrorState";
import {Screen} from "@/widgets/Screen";
import {Section} from "@/widgets/Section";
import {GenreTiles} from "@/pages/DiscoverPage/widgets/GenreTiles";
import {SearchField} from "@/pages/DiscoverPage/widgets/SearchField";
import {useGenreMedia, useNewReleases, useSearch} from "@/hooks/discover";
import {useDebouncedValue} from "@/hooks/useDebouncedValue";
import {useDepartmentLabel} from "@/hooks/useDepartmentLabel";
import {buildRoute} from "@/constants/routes";
import {MEDIA_FILTER, SEARCH_DEBOUNCE_MS, type MediaFilter} from "@/constants/other";
import type {GenreTile} from "@/constants/genres";
import type {MediaSummary} from "@/api/media.api";

const MIN_SEARCH_LENGTH = 2;

const openMedia = (media: MediaSummary) => router.push(buildRoute.media(media));

/** Find anything by name, browse by genre, or see what just came out. */
export const DiscoverPage = () => {
    const {t} = useTranslation(["discover", "common"]);
    const departmentLabel = useDepartmentLabel();
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<MediaFilter>(MEDIA_FILTER.ALL);
    const [genre, setGenre] = useState<GenreTile | null>(null);

    const searchTerm = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
    const isSearching = searchTerm.length >= MIN_SEARCH_LENGTH;
    const search = useSearch(searchTerm);
    const releases = useNewReleases(filter);
    const byGenre = useGenreMedia(filter, genre);

    const searchResults = useMemo(
        () => (search.data?.media ?? []).filter((media) => filter === MEDIA_FILTER.ALL || media.media_type === filter),
        [search.data, filter],
    );
    // People are neither movies nor series, so they only show under "All".
    const people = useMemo(
        () => (filter === MEDIA_FILTER.ALL ? search.data?.people ?? [] : []).map((person) => ({...person, character: departmentLabel(person.known_for_department)})),
        [search.data, filter, departmentLabel],
    );

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

        if (genre) {
            if (byGenre.isError) return <QueryErrorState error={byGenre.error} onRetry={() => void byGenre.refetch()}/>;
            return (
                <Section title={t(`genres.${genre.key}`)}>
                    <PosterGrid items={byGenre.data ?? []} isLoading={byGenre.isLoading} onPress={openMedia}/>
                </Section>
            );
        }

        if (releases.isError) return <QueryErrorState error={releases.error} onRetry={() => void releases.refetch()}/>;
        return (
            <Section title={t("newReleases")}>
                <PosterGrid items={releases.data ?? []} isLoading={releases.isLoading} onPress={openMedia}/>
            </Section>
        );
    };

    return (
        <Screen>
            <PageTitle title={t("title")}/>
            <SearchField value={query} onChangeText={setQuery} label={t("searchLabel")} placeholder={t("searchPlaceholder")}/>
            <SegmentedControl options={options} value={filter} onChange={setFilter} label={t("title")}/>
            {!isSearching && <GenreTiles selected={genre} onSelect={setGenre}/>}
            {renderContent()}
        </Screen>
    );
};
