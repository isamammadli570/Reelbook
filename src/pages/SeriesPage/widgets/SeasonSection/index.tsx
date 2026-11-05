import {useCallback, useMemo, useState} from "react";
import {Pressable, ScrollView, Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {Skeleton} from "@/components/ui/skeleton";
import {EmptyState} from "@/widgets/EmptyState";
import {QueryErrorState} from "@/widgets/QueryErrorState";
import {Section} from "@/widgets/Section";
import {EpisodeMap, type EpisodeCell} from "@/pages/SeriesPage/widgets/EpisodeMap";
import {EpisodeRow} from "@/pages/SeriesPage/widgets/EpisodeRow";
import {useGetSeason} from "@/hooks/details";
import {useSetSeasonWatched, useToggleEpisode} from "@/hooks/library";
import {defaultSeasonNumber, isReleased, orderSeasons} from "@/helpers/details";
import {isEpisodeWatched, nextEpisode} from "@/helpers/library";
import {haptics} from "@/lib/haptics";
import {cn} from "@/lib/utils";
import type {LibraryItem, MediaSnapshot} from "@/api/library.api";
import type {Episode, SeasonSummary} from "@/api/series.api";

type SeasonSectionProps = {
    seriesId: number;
    seasons: SeasonSummary[];
    snapshot: MediaSnapshot;
    item: LibraryItem | undefined;
};

/** Season chips, the chosen season's episode map and episode list, all markable as watched. */
export const SeasonSection = ({seriesId, seasons, snapshot, item}: SeasonSectionProps) => {
    const {t} = useTranslation("details");
    const ordered = useMemo(() => orderSeasons(seasons), [seasons]);
    const [seasonNumber, setSeasonNumber] = useState(() => defaultSeasonNumber(seasons));
    const {data: season, isLoading, isError, error, refetch} = useGetSeason(seriesId, seasonNumber);
    const {mutate: toggleEpisode} = useToggleEpisode();
    const {mutate: setSeasonWatched} = useSetSeasonWatched();

    const cells = useMemo<EpisodeCell[]>(() => {
        const next = item ? nextEpisode(item) : null;
        return (season?.episodes ?? []).map((episode) => {
            const ref = {season: episode.season_number, episode: episode.episode_number};
            return {
                episode,
                isWatched: isEpisodeWatched(item, ref),
                isReleased: isReleased(episode.air_date),
                isNext: next?.season === ref.season && next.episode === ref.episode,
            };
        });
    }, [season, item]);

    const releasedCells = cells.filter((cell) => cell.isReleased);
    const isSeasonWatched = releasedCells.length > 0 && releasedCells.every((cell) => cell.isWatched);

    const toggle = useCallback((episode: Episode) => {
        haptics.tap();
        toggleEpisode({snapshot, episode: {season: episode.season_number, episode: episode.episode_number}});
    }, [snapshot, toggleEpisode]);

    const toggleSeason = () => {
        if (seasonNumber === null) return;
        haptics.success();
        setSeasonWatched({snapshot, season: seasonNumber, episodes: releasedCells.map((cell) => cell.episode.episode_number), isWatched: !isSeasonWatched});
    };

    if (!ordered.length) return null;

    const renderEpisodes = () => {
        if (isLoading) return Array.from({length: 3}, (_, index) => <Skeleton key={index} className="h-20 w-full rounded-2xl"/>);
        if (isError) return <QueryErrorState error={error} onRetry={() => void refetch()}/>;
        if (!cells.length) return <EmptyState title={t("noEpisodes")}/>;
        return (
            <>
                <EpisodeMap cells={cells} onToggle={toggle}/>
                {releasedCells.length > 0 && (
                    <Pressable onPress={toggleSeason} className="h-10 items-center justify-center rounded-xl border border-border">
                        <Text className="font-sans-medium text-[13px] text-foreground">{isSeasonWatched ? t("episodeActions.unmarkSeason") : t("episodeActions.markSeason")}</Text>
                    </Pressable>
                )}
                {cells.map((cell) => (
                    <EpisodeRow key={cell.episode.id} episode={cell.episode} isWatched={cell.isWatched} isReleased={cell.isReleased} onToggle={toggle}/>
                ))}
            </>
        );
    };

    return (
        <Section title={t("episodes")}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5" contentContainerClassName="gap-2 px-5">
                {ordered.map((summary) => {
                    const isSelected = summary.season_number === seasonNumber;
                    return (
                        <Pressable
                            key={summary.id}
                            onPress={() => setSeasonNumber(summary.season_number)}
                            aria-selected={isSelected}
                            className={cn("h-9 justify-center rounded-full border px-4", isSelected ? "border-foreground bg-foreground" : "border-border")}
                        >
                            <Text className={cn("font-sans-medium text-[13px]", isSelected ? "text-background" : "text-muted-foreground")}>
                                {summary.season_number === 0 ? t("specials") : t("season", {number: summary.season_number})}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>
            <View className="gap-2.5">{renderEpisodes()}</View>
        </Section>
    );
};
