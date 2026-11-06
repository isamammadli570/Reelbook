import {useMemo} from "react";
import {Text} from "react-native";
import {useLocalSearchParams} from "expo-router";
import {useTranslation} from "react-i18next";
import {CastRow} from "@/widgets/CastRow";
import {DetailErrorState} from "@/widgets/DetailErrorState";
import {DetailHero} from "@/widgets/DetailHero";
import {DetailBody, DetailScreen} from "@/widgets/DetailScreen";
import {DetailSkeleton} from "@/widgets/DetailSkeleton";
import {ExpandableText} from "@/widgets/ExpandableText";
import {Recommendations} from "@/widgets/Recommendations";
import {Section} from "@/widgets/Section";
import {RatingPanel} from "@/widgets/RatingPanel";
import {ReviewSection} from "@/widgets/ReviewSection";
import {StatStrip} from "@/widgets/StatStrip";
import {TrailerButton} from "@/widgets/TrailerButton";
import {WhereToWatch} from "@/widgets/WhereToWatch";
import {ExternalLinks} from "@/widgets/ExternalLinks";
import {SeasonSection} from "@/pages/SeriesPage/widgets/SeasonSection";
import {SeriesActions} from "@/pages/SeriesPage/widgets/SeriesActions";
import {SeriesProgress} from "@/pages/SeriesPage/widgets/SeriesProgress";
import {useGetSeries} from "@/hooks/details";
import {useLibraryItem, useSyncSnapshot} from "@/hooks/library";
import {useDateFormat} from "@/hooks/useDateFormat";
import {useFormatRuntime} from "@/hooks/useFormatRuntime";
import {formatScore} from "@/helpers/details";
import {seriesSnapshot} from "@/helpers/library";
import {translateGenre} from "@/helpers/genres";
import {mediaYear} from "@/helpers/media";
import {pickLogo, seriesCast, seriesCertification} from "@/helpers/titleExtras";
import {watchRegions} from "@/lib/region";
import {MEDIA_TYPE, SERIES_STATUS_KEY} from "@/constants/other";

/** A series: backdrop and poster, key numbers, overview, seasons with episodes, cast and similar series. */
export const SeriesPage = () => {
    const {id} = useLocalSearchParams<{id: string}>();
    const seriesId = Number(id);
    const {t, i18n} = useTranslation(["details", "common"]);
    const formatRuntime = useFormatRuntime();
    const {shortDate} = useDateFormat();
    const {data: series, isLoading, isError, error, refetch} = useGetSeries(seriesId);
    const item = useLibraryItem(MEDIA_TYPE.TV, seriesId);
    // Memoised so episode rows keep stable toggle callbacks.
    const snapshot = useMemo(() => (series ? seriesSnapshot(series) : null), [series]);
    useSyncSnapshot(snapshot, item !== undefined);

    const cast = useMemo(() => {
        const whole = seriesCast(series?.aggregate_credits, (count) => t("castEpisodes", {count}));
        return whole.length ? whole : series?.credits.cast ?? [];
    }, [series, t]);

    if (isLoading) return <DetailSkeleton/>;
    if (isError || !series || !snapshot) return <DetailErrorState error={error} onRetry={() => void refetch()}/>;

    const year = mediaYear(series);
    const statusKey = SERIES_STATUS_KEY[series.status];
    const network = series.networks[0]?.name;
    const nextAirDate = shortDate(series.next_episode_to_air?.air_date);
    const episodeRuntime = series.episode_run_time[0] ?? series.next_episode_to_air?.runtime;
    const meta = [series.genres.slice(0, 2).map((genre) => translateGenre(genre.name, i18n.language)).join(", "), statusKey ? t(`status.${statusKey}`) : null].filter(Boolean).join(" · ");

    const stats = [
        {value: formatScore(series.vote_average), label: t("tmdb")},
        {value: String(series.number_of_seasons || "—"), label: t("stats.seasons")},
        {value: String(series.number_of_episodes || "—"), label: t("stats.episodes")},
    ];
    const runtimeLabel = formatRuntime(episodeRuntime);
    if (runtimeLabel) stats.push({value: runtimeLabel, label: t("stats.episodeRuntime")});

    return (
        <DetailScreen>
            <DetailHero
                title={series.name}
                backdropPath={series.backdrop_path}
                posterPath={series.poster_path}
                eyebrow={[t("common:mediaType.tv"), network ?? year].filter(Boolean).join(" · ")}
                badge={seriesCertification(series.content_ratings, watchRegions(i18n.language))}
                logoPath={pickLogo(series.images?.logos, i18n.language)?.file_path}
                meta={meta}
                action={<TrailerButton videos={series.videos.results}/>}
            />
            <DetailBody>
                <StatStrip stats={stats}/>
                {nextAirDate && <Text className="-mt-3 font-sans-medium text-[13px] text-brand">{t("nextEpisode", {date: nextAirDate})}</Text>}
                <SeriesActions snapshot={snapshot} item={item}/>
                <SeriesProgress item={item}/>
                <RatingPanel snapshot={snapshot} item={item}/>
                <Section title={t("overview")}>
                    <ExpandableText text={series.overview || t("noOverview")}/>
                </Section>
                <WhereToWatch results={series["watch/providers"].results}/>
                <ReviewSection snapshot={snapshot} item={item}/>
                <SeasonSection seriesId={seriesId} seasons={series.seasons} snapshot={snapshot} item={item}/>
                {/* Every season's cast, with episode counts, rather than only the latest season's. */}
                {cast.length > 0 && (
                    <Section title={t("cast")}>
                        <CastRow cast={cast}/>
                    </Section>
                )}
                <Recommendations title={t("similarSeries")} items={series.recommendations.results}/>
                <ExternalLinks mediaType="tv" tmdbId={series.id} externalIds={series.external_ids} homepage={series.homepage}/>
            </DetailBody>
        </DetailScreen>
    );
};
