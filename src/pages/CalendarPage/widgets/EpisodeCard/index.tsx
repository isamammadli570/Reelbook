import {Pressable, Text, View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {Image} from "@/components/ui/image";
import {useFormatRuntime} from "@/hooks/useFormatRuntime";
import {imageUrl} from "@/helpers/media";
import {usePreference} from "@/lib/preferences";
import {buildRoute} from "@/constants/routes";
import {IMAGE_SIZE} from "@/constants/other";
import type {UpcomingEpisode} from "@/helpers/calendar";

type EpisodeCardProps = {episode: UpcomingEpisode};

/** One airing episode: poster, series, "S2 · E7", its name (unless spoilers are hidden), and network with length. */
export const EpisodeCard = ({episode}: EpisodeCardProps) => {
    const {t} = useTranslation("details");
    const formatRuntime = useFormatRuntime();
    const [isHidingSpoilers] = usePreference("hideSpoilers");
    const poster = imageUrl(episode.posterPath, IMAGE_SIZE.POSTER);
    const meta = [episode.network, formatRuntime(episode.runtime)].filter(Boolean).join(" · ");

    return (
        <Pressable onPress={() => router.push(buildRoute.series(episode.seriesId))} className="flex-row items-center gap-3.5 rounded-2xl bg-surface p-2.5">
            <View className="h-[72px] w-12 overflow-hidden rounded-lg bg-surface-raised">
                {poster && <Image source={poster} className="h-full w-full" contentFit="cover"/>}
            </View>
            <View className="min-w-0 flex-1 gap-0.5">
                <Text className="font-sans-medium text-[11px] text-brand">{t("episodeCode", {season: episode.season, episode: episode.episode})}</Text>
                <Text className="font-sans-medium text-[15px] text-foreground" numberOfLines={1}>{episode.title}</Text>
                {!isHidingSpoilers && <Text className="font-sans text-xs text-muted-foreground" numberOfLines={1}>{episode.episodeName}</Text>}
                {meta && <Text className="font-sans text-[11px] text-muted-foreground" numberOfLines={1}>{meta}</Text>}
            </View>
        </Pressable>
    );
};
