import {memo} from "react";
import {Pressable, Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {Check} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {Image} from "@/components/ui/image";
import {useDateFormat} from "@/hooks/useDateFormat";
import {useFormatRuntime} from "@/hooks/useFormatRuntime";
import {imageUrl} from "@/helpers/media";
import {cn} from "@/lib/utils";
import {IMAGE_SIZE} from "@/constants/other";
import type {Episode} from "@/api/series.api";

type EpisodeRowProps = {
    episode: Episode;
    isWatched: boolean;
    isReleased: boolean;
    onToggle: (episode: Episode) => void;
};

/** One episode: still frame, "S2 · E7", title, air date and length, with a watched toggle once it has aired. */
export const EpisodeRow = memo(({episode, isWatched, isReleased, onToggle}: EpisodeRowProps) => {
    const {t} = useTranslation("details");
    const formatRuntime = useFormatRuntime();
    const {shortDate} = useDateFormat();
    const [successInk, foreground] = useCSSVariable(["--color-background", "--color-foreground"]).map(String);
    const still = imageUrl(episode.still_path, IMAGE_SIZE.BACKDROP);
    const code = t("episodeCode", {season: episode.season_number, episode: episode.episode_number});
    const meta = [shortDate(episode.air_date) ?? t("dateUnknown"), formatRuntime(episode.runtime)].filter(Boolean).join(" · ");

    return (
        <View className={cn("flex-row items-center gap-3 rounded-2xl bg-surface p-2", !isReleased && "opacity-60")}>
            <View className="h-16 w-28 overflow-hidden rounded-xl bg-surface-raised">
                {still && <Image source={still} className="h-full w-full" contentFit="cover" transition={200}/>}
            </View>
            <View className="min-w-0 flex-1 gap-0.5">
                <Text className="font-sans-medium text-[11px] text-brand">{code}</Text>
                <Text className="font-sans-medium text-sm text-foreground" numberOfLines={1}>{episode.name}</Text>
                <Text className="font-sans text-[11px] text-muted-foreground" numberOfLines={1}>{isReleased ? meta : `${meta} · ${t("episodeActions.notAired")}`}</Text>
            </View>
            {isReleased && (
                <Pressable
                    role="checkbox"
                    aria-checked={isWatched}
                    aria-label={isWatched ? t("episodeActions.unmark", {code}) : t("episodeActions.mark", {code})}
                    onPress={() => onToggle(episode)}
                    hitSlop={6}
                    className={cn("mr-1 h-10 w-10 items-center justify-center rounded-full", isWatched ? "bg-success" : "border-[1.5px] border-border")}
                >
                    <Check size={18} strokeWidth={2.5} color={isWatched ? successInk : foreground}/>
                </Pressable>
            )}
        </View>
    );
});
EpisodeRow.displayName = "EpisodeRow";
