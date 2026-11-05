import {Text, View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {LinearGradient} from "expo-linear-gradient";
import {Check} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {Button} from "@/components/ui/button";
import {Image} from "@/components/ui/image";
import {ProgressBar} from "@/widgets/ProgressBar";
import {useGetSeason} from "@/hooks/details";
import {useToggleEpisode} from "@/hooks/library";
import {useFormatRuntime} from "@/hooks/useFormatRuntime";
import {withAlpha} from "@/helpers/details";
import {seriesProgress} from "@/helpers/library";
import {imageUrl} from "@/helpers/media";
import {haptics} from "@/lib/haptics";
import {buildRoute} from "@/constants/routes";
import {IMAGE_SIZE} from "@/constants/other";
import type {EpisodeRef, LibraryItem} from "@/api/library.api";

type UpNextHeroProps = {
    item: LibraryItem;
    next: EpisodeRef;
};

/** The big "tonight" card: the most recently watched series' next episode, markable in one tap. */
export const UpNextHero = ({item, next}: UpNextHeroProps) => {
    const {t} = useTranslation(["home", "details"]);
    const formatRuntime = useFormatRuntime();
    const surface = String(useCSSVariable("--color-surface"));
    const {mutate: toggleEpisode} = useToggleEpisode();
    // The episode title is not stored, so it comes from the (cached) season request.
    const {data: season} = useGetSeason(item.id, next.season);
    const episode = season?.episodes.find((candidate) => candidate.episode_number === next.episode);

    const backdrop = imageUrl(item.backdropPath, IMAGE_SIZE.BACKDROP);
    const {watched, aired, percent} = seriesProgress(item);
    const meta = [
        t("details:episodeCode", {season: next.season, episode: next.episode}),
        episode?.name,
        formatRuntime(episode?.runtime ?? item.series?.episodeRuntime),
    ].filter(Boolean).join(" · ");

    return (
        <View className="h-[248px] overflow-hidden rounded-3xl bg-surface">
            {backdrop && <Image source={backdrop} className="absolute inset-0" contentFit="cover" transition={250}/>}
            <LinearGradient colors={[withAlpha(surface, 0.1), withAlpha(surface, 0.55), withAlpha(surface, 0.97)]} locations={[0, 0.4, 0.85]} style={{position: "absolute", inset: 0}}/>
            <View className="flex-1 justify-between p-4">
                <View className="flex-row items-center justify-between">
                    <Text className="overflow-hidden rounded-[10px] bg-black/45 px-2.5 py-1 font-sans-medium text-xs text-foreground">{t("upNext.badge")}</Text>
                    {item.series?.network && <Text className="font-sans text-xs text-foreground">{item.series.network}</Text>}
                </View>
                <View className="gap-2">
                    <Text className="font-serif text-[32px] leading-[32px] text-foreground" numberOfLines={1}>{item.title}</Text>
                    <Text className="font-sans text-[13px] text-muted-foreground" numberOfLines={1}>{meta}</Text>
                    <View className="flex-row items-center gap-2.5">
                        <ProgressBar percent={percent} className="flex-1 bg-white/15" fillClassName="bg-foreground"/>
                        <Text className="font-sans text-xs text-muted-foreground">{watched} / {aired}</Text>
                    </View>
                    <View className="mt-0.5 flex-row gap-2">
                        <Button
                            variant="primary"
                            icon={Check}
                            label={t("upNext.markWatched")}
                            className="flex-1"
                            onPress={() => {
                                haptics.success();
                                toggleEpisode({snapshot: item, episode: next});
                            }}
                        />
                        <Button label={t("upNext.details")} className="flex-1 bg-white/10" onPress={() => router.push(buildRoute.series(item.id))}/>
                    </View>
                </View>
            </View>
        </View>
    );
};
