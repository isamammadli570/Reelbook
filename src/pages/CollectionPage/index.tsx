import {useMemo} from "react";
import {Text, View} from "react-native";
import {router, useLocalSearchParams} from "expo-router";
import {useTranslation} from "react-i18next";
import {Check} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {DetailErrorState} from "@/widgets/DetailErrorState";
import {DetailHero} from "@/widgets/DetailHero";
import {DetailBody, DetailScreen} from "@/widgets/DetailScreen";
import {DetailSkeleton} from "@/widgets/DetailSkeleton";
import {ExpandableText} from "@/widgets/ExpandableText";
import {PosterGrid} from "@/widgets/PosterGrid";
import {ProgressBar} from "@/widgets/ProgressBar";
import {Section} from "@/widgets/Section";
import {useGetCollection} from "@/hooks/details";
import {useGetLibrary} from "@/hooks/library";
import {itemKey} from "@/helpers/library";
import {mediaYear} from "@/helpers/media";
import {collectionParts, watchedInCollection} from "@/helpers/titleExtras";
import {buildRoute} from "@/constants/routes";
import {MEDIA_TYPE} from "@/constants/other";

const GRID_COLUMNS = 3;

/** A franchise: every film in release order, each ticked once watched, and how far through it the user is. */
export const CollectionPage = () => {
    const {id} = useLocalSearchParams<{id: string}>();
    const {t} = useTranslation("details");
    const success = String(useCSSVariable("--color-success"));
    const {data: collection, isLoading, isError, error, refetch} = useGetCollection(Number(id));
    const {data: library} = useGetLibrary();
    const parts = useMemo(() => collectionParts(collection?.parts ?? []), [collection]);

    if (isLoading) return <DetailSkeleton/>;
    if (isError || !collection) return <DetailErrorState error={error} onRetry={() => void refetch()}/>;

    const isWatched = (movieId: number) => Boolean(library?.items[itemKey(MEDIA_TYPE.MOVIE, movieId)]?.diary.length);
    const watched = watchedInCollection(parts, isWatched);

    return (
        <DetailScreen>
            <DetailHero
                title={collection.name}
                backdropPath={collection.backdrop_path}
                posterPath={collection.poster_path}
                eyebrow={t("collection.eyebrow")}
                meta={t("collection.films", {count: parts.length})}
            />
            <DetailBody>
                <View className="gap-2 rounded-2xl bg-surface p-4">
                    <Text className="font-sans-medium text-sm text-foreground">{t("collection.progress", {count: parts.length, watched})}</Text>
                    <ProgressBar percent={parts.length ? (watched / parts.length) * 100 : 0} className="h-1.5" fillClassName="bg-brand"/>
                </View>
                {collection.overview ? (
                    <Section title={t("overview")}>
                        <ExpandableText text={collection.overview}/>
                    </Section>
                ) : null}
                <Section title={t("collection.filmsTitle")} index={1}>
                    <PosterGrid
                        columns={GRID_COLUMNS}
                        items={parts}
                        onPress={(media) => router.push(buildRoute.media(media))}
                        renderFooter={(media) => (
                            <View className="flex-row items-center gap-1">
                                <Text className="font-sans text-[11px] text-muted-foreground">{mediaYear(media) || "—"}</Text>
                                {isWatched(media.id) && <Check size={12} strokeWidth={3} color={success}/>}
                            </View>
                        )}
                    />
                </Section>
            </DetailBody>
        </DetailScreen>
    );
};
