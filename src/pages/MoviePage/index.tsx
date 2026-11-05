import {useMemo} from "react";
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
import {StatStrip} from "@/widgets/StatStrip";
import {MovieActions} from "@/pages/MoviePage/widgets/MovieActions";
import {MovieDiary} from "@/pages/MoviePage/widgets/MovieDiary";
import {useGetMovie} from "@/hooks/details";
import {useLibraryItem, useSyncSnapshot} from "@/hooks/library";
import {useFormatRuntime} from "@/hooks/useFormatRuntime";
import {directorNames, formatScore} from "@/helpers/details";
import {movieSnapshot} from "@/helpers/library";
import {mediaYear} from "@/helpers/media";
import {MEDIA_TYPE} from "@/constants/other";

/** A movie: backdrop and poster, key numbers, overview, cast and similar movies. */
export const MoviePage = () => {
    const {id} = useLocalSearchParams<{id: string}>();
    const {t} = useTranslation(["details", "common"]);
    const formatRuntime = useFormatRuntime();
    const movieId = Number(id);
    const {data: movie, isLoading, isError, error, refetch} = useGetMovie(movieId);
    const item = useLibraryItem(MEDIA_TYPE.MOVIE, movieId);
    const snapshot = useMemo(() => (movie ? movieSnapshot(movie) : null), [movie]);
    useSyncSnapshot(snapshot, item !== undefined);

    if (isLoading) return <DetailSkeleton/>;
    if (isError || !movie || !snapshot) return <DetailErrorState error={error} onRetry={() => void refetch()}/>;

    const directors = directorNames(movie.credits.crew);
    const year = mediaYear(movie);
    const meta = [movie.genres.slice(0, 2).map((genre) => genre.name).join(", "), directors.length ? t("directedBy", {names: directors.join(", ")}) : null]
        .filter(Boolean)
        .join(" · ");

    const stats = [
        {value: formatScore(movie.vote_average), label: t("tmdb")},
        {value: formatRuntime(movie.runtime) ?? "—", label: t("stats.runtime")},
        {value: year || "—", label: t("stats.year")},
    ];

    return (
        <DetailScreen>
            <DetailHero
                title={movie.title}
                backdropPath={movie.backdrop_path}
                posterPath={movie.poster_path}
                eyebrow={[t("common:mediaType.movie"), year].filter(Boolean).join(" · ")}
                meta={meta}
            />
            <DetailBody>
                <StatStrip stats={stats}/>
                <MovieActions snapshot={snapshot} item={item}/>
                <RatingPanel snapshot={snapshot} item={item}/>
                <Section title={t("overview")}>
                    <ExpandableText text={movie.overview || t("noOverview")}/>
                </Section>
                <MovieDiary snapshot={snapshot} item={item}/>
                {movie.credits.cast.length > 0 && (
                    <Section title={t("cast")}>
                        <CastRow cast={movie.credits.cast}/>
                    </Section>
                )}
                <Recommendations title={t("similarMovies")} items={movie.recommendations.results}/>
            </DetailBody>
        </DetailScreen>
    );
};
