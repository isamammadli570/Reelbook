import {useCallback, useMemo, useState} from "react";
import {ScrollView, Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {PressScale} from "@/components/motion/PressScale";
import {Reveal} from "@/components/motion/Reveal";
import {SlidingHighlight, SlidingLabel, useSlidingHighlight} from "@/components/motion/SlidingHighlight";
import {Skeleton} from "@/components/ui/skeleton";
import {EmptyState} from "@/widgets/EmptyState";
import {QueryErrorState} from "@/widgets/QueryErrorState";
import {Section} from "@/widgets/Section";
import {EarlierEpisodesSheet} from "@/pages/SeriesPage/widgets/EarlierEpisodesSheet";
import {EpisodeMap, type EpisodeCell} from "@/pages/SeriesPage/widgets/EpisodeMap";
import {EpisodeRow} from "@/pages/SeriesPage/widgets/EpisodeRow";
import {EpisodeSheet} from "@/pages/SeriesPage/widgets/EpisodeSheet";
import {useGetSeason} from "@/hooks/details";
import {useRestoreEpisodes, useSetSeasonWatched, useToggleEpisode} from "@/hooks/library";
import {defaultSeasonNumber, isReleased, orderSeasons} from "@/helpers/details";
import {episodeKey, isEpisodeWatched, nextEpisode} from "@/helpers/library";
import {haptics} from "@/lib/haptics";
import {usePreference} from "@/lib/preferences";
import {toast} from "@/lib/toast";
import {cn} from "@/lib/utils";
import type {LibraryItem, MediaSnapshot} from "@/api/library.api";
import type {Episode, SeasonSummary} from "@/api/series.api";

/**
 * Episode rows drawn at first, and added per tap. A long season (anime, daily shows) can hold hundreds, each
 * with its own still; the square map above still shows every one of them.
 */
const EPISODES_PER_PAGE = 20;

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
    const [visibleCount, setVisibleCount] = useState(EPISODES_PER_PAGE);
    const chooseSeason = (number: number) => {
        setSeasonNumber(number);
        setVisibleCount(EPISODES_PER_PAGE);
    };
    const {data: season, isLoading, isError, error, refetch} = useGetSeason(seriesId, seasonNumber);
    const {mutate: toggleEpisode} = useToggleEpisode();
    const {mutate: setSeasonWatched} = useSetSeasonWatched();
    const {mutate: restoreEpisodes} = useRestoreEpisodes();
    const highlight = useSlidingHighlight(Math.max(0, ordered.findIndex((summary) => summary.season_number === seasonNumber)));

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

    // The open episode's cell is read fresh, so marking it in the sheet updates the sheet's button too.
    const [openEpisode, setOpenEpisode] = useState<Episode | null>(null);
    const openCell = openEpisode ? cells.find((cell) => cell.episode.id === openEpisode.id) : undefined;
    const releasedCells = cells.filter((cell) => cell.isReleased);
    const isSeasonWatched = releasedCells.length > 0 && releasedCells.every((cell) => cell.isWatched);

    const [earlierPolicy, setEarlierPolicy] = usePreference("earlierEpisodes");
    // The episode being marked while earlier ones are still open, waiting for the answer.
    const [pending, setPending] = useState<{episode: Episode; earlier: number[]} | null>(null);

    const markWithEarlier = useCallback((episode: Episode, earlier: number[]) => {
        haptics.success();
        setSeasonWatched({snapshot, season: episode.season_number, episodes: [...earlier, episode.episode_number], isWatched: true});
    }, [snapshot, setSeasonWatched]);

    const toggle = useCallback((episode: Episode) => {
        const isWatched = cells.find((cell) => cell.episode.id === episode.id)?.isWatched;
        // Only marking asks; earlier aired episodes of this season that are still open.
        const earlier = isWatched || earlierPolicy === "skip"
            ? []
            : releasedCells.filter((cell) => !cell.isWatched && cell.episode.episode_number < episode.episode_number).map((cell) => cell.episode.episode_number);
        if (earlier.length && earlierPolicy === "mark") return markWithEarlier(episode, earlier);
        if (earlier.length) return setPending({episode, earlier});
        haptics.tap();
        toggleEpisode({snapshot, episode: {season: episode.season_number, episode: episode.episode_number}});
    }, [cells, releasedCells, earlierPolicy, markWithEarlier, snapshot, toggleEpisode]);

    const answerEarlier = (markEarlier: boolean, remember: boolean) => {
        if (!pending) return;
        const {episode, earlier} = pending;
        setPending(null);
        if (remember) setEarlierPolicy(markEarlier ? "mark" : "skip");
        if (markEarlier) return markWithEarlier(episode, earlier);
        haptics.tap();
        toggleEpisode({snapshot, episode: {season: episode.season_number, episode: episode.episode_number}});
    };

    const toggleSeason = () => {
        if (seasonNumber === null) return;
        haptics.success();
        const numbers = releasedCells.map((cell) => cell.episode.episode_number);
        // Keep the dates being cleared, so undo brings them back as they were rather than as today.
        const cleared = isSeasonWatched
            ? Object.fromEntries(Object.entries(item?.episodes ?? {}).filter(([key]) => numbers.some((number) => key === episodeKey({season: seasonNumber, episode: number}))))
            : null;
        setSeasonWatched({snapshot, season: seasonNumber, episodes: numbers, isWatched: !isSeasonWatched}, {
            onSuccess: () => {
                if (!cleared) return;
                toast.show({
                    message: t("toast.seasonUnmarked", {number: seasonNumber}),
                    action: {label: t("toast.undo"), onPress: () => restoreEpisodes({snapshot, episodes: cleared})},
                });
            },
        });
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
                    <PressScale onPress={toggleSeason} className="h-10 items-center justify-center rounded-xl border border-border">
                        <Text className="font-sans-medium text-[13px] text-foreground">{isSeasonWatched ? t("episodeActions.unmarkSeason") : t("episodeActions.markSeason")}</Text>
                    </PressScale>
                )}
                {cells.slice(0, visibleCount).map((cell, index) => (
                    // Rows are keyed by episode, so a newly opened season rises in row after row.
                    <Reveal key={cell.episode.id} index={index % EPISODES_PER_PAGE} variant="rise">
                        <EpisodeRow episode={cell.episode} isWatched={cell.isWatched} isReleased={cell.isReleased} onToggle={toggle} onOpen={setOpenEpisode}/>
                    </Reveal>
                ))}
                {cells.length > visibleCount && (
                    <PressScale onPress={() => setVisibleCount((count) => count + EPISODES_PER_PAGE)} className="h-10 items-center justify-center rounded-xl border border-border">
                        <Text className="font-sans-medium text-[13px] text-foreground">
                            {t("episodeActions.showMore", {count: Math.min(EPISODES_PER_PAGE, cells.length - visibleCount), left: cells.length - visibleCount})}
                        </Text>
                    </PressScale>
                )}
            </>
        );
    };

    return (
        <Section title={t("episodes")}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5" contentContainerClassName="gap-2 px-5">
                {/* One pill slides between seasons, as in the tab bar. */}
                <SlidingHighlight style={highlight.style} className="rounded-full bg-foreground"/>
                {ordered.map((summary, index) => {
                    const isSelected = summary.season_number === seasonNumber;
                    return (
                        <PressScale
                            key={summary.id}
                            onPress={() => chooseSeason(summary.season_number)}
                            onLayout={highlight.measure(index)}
                            aria-selected={isSelected}
                            className={cn("h-9 justify-center rounded-full border px-4", isSelected ? "border-transparent" : "border-border")}
                        >
                            <SlidingLabel x={highlight.x} box={highlight.boxes[index]} restColor="--color-muted-foreground" activeColor="--color-background" className="font-sans-medium text-[13px]">
                                {summary.season_number === 0 ? t("specials") : t("season", {number: summary.season_number})}
                            </SlidingLabel>
                        </PressScale>
                    );
                })}
            </ScrollView>
            <View className="gap-2.5">{renderEpisodes()}</View>
            <EarlierEpisodesSheet isOpen={pending !== null} count={pending?.earlier.length ?? 0} onAnswer={answerEarlier} onClose={() => setPending(null)}/>
            <EpisodeSheet
                episode={openEpisode}
                isWatched={Boolean(openCell?.isWatched)}
                isReleased={Boolean(openCell?.isReleased)}
                onClose={() => setOpenEpisode(null)}
                onToggle={toggle}
            />
        </Section>
    );
};
