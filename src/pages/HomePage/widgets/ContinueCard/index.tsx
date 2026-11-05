import {memo} from "react";
import {Pressable, Text, View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {Check} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {Image} from "@/components/ui/image";
import {ProgressBar} from "@/widgets/ProgressBar";
import {useToggleEpisode} from "@/hooks/library";
import {seriesProgress} from "@/helpers/library";
import {imageUrl} from "@/helpers/media";
import {haptics} from "@/lib/haptics";
import {buildRoute} from "@/constants/routes";
import {IMAGE_SIZE} from "@/constants/other";
import type {EpisodeRef, LibraryItem} from "@/api/library.api";

type ContinueCardProps = {
    item: LibraryItem;
    next: EpisodeRef;
};

/** Compact "keep watching" card: poster, next episode, progress and a mark-watched button. */
export const ContinueCard = memo(({item, next}: ContinueCardProps) => {
    const {t} = useTranslation(["home", "details"]);
    const foreground = String(useCSSVariable("--color-foreground"));
    const {mutate: toggleEpisode} = useToggleEpisode();
    const poster = imageUrl(item.posterPath, IMAGE_SIZE.POSTER);
    const code = t("details:episodeCode", {season: next.season, episode: next.episode});

    return (
        <View className="h-[92px] w-[264px] flex-row items-center gap-3 rounded-2xl bg-surface p-2.5">
            <Pressable onPress={() => router.push(buildRoute.series(item.id))} aria-label={item.title} className="min-w-0 flex-1 flex-row items-center gap-3">
                <View className="h-[70px] w-[47px] overflow-hidden rounded-lg bg-surface-raised">
                    {poster && <Image source={poster} className="h-full w-full" contentFit="cover"/>}
                </View>
                <View className="min-w-0 flex-1 gap-1">
                    <Text className="font-sans-medium text-[15px] text-foreground" numberOfLines={1}>{item.title}</Text>
                    <Text className="font-sans text-xs text-muted-foreground">{t("upNext.next", {code})}</Text>
                    <ProgressBar percent={seriesProgress(item).percent} className="mt-1 h-1" fillClassName="bg-brand"/>
                </View>
            </Pressable>
            <Pressable
                aria-label={t("details:episodeActions.mark", {code})}
                onPress={() => {
                    haptics.success();
                    toggleEpisode({snapshot: item, episode: next});
                }}
                hitSlop={6}
                className="h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-border"
            >
                <Check size={18} strokeWidth={2.5} color={foreground}/>
            </Pressable>
        </View>
    );
});
ContinueCard.displayName = "ContinueCard";
