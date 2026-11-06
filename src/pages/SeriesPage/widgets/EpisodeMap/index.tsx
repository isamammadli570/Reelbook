import {Text, View, useWindowDimensions} from "react-native";
import {useTranslation} from "react-i18next";
import {PressScale} from "@/components/motion/PressScale";
import {AnimatedView} from "@/components/ui/animated";
import {SCREEN_GUTTER} from "@/hooks/usePosterWidth";
import {enteringFor} from "@/lib/motion";
import {cn} from "@/lib/utils";
import {MAX_CONTENT_WIDTH} from "@/constants/other";
import type {Episode} from "@/api/series.api";

const COLUMNS = 10;
const GAP = 4;

export type EpisodeCell = {
    episode: Episode;
    isWatched: boolean;
    isReleased: boolean;
    isNext: boolean;
};

type EpisodeMapProps = {
    cells: EpisodeCell[];
    onToggle: (episode: Episode) => void;
};

/** A season at a glance: one square per episode, filled when watched, ringed when it is the next one. Squares pop in as a wave. */
export const EpisodeMap = ({cells, onToggle}: EpisodeMapProps) => {
    const {t} = useTranslation("details");
    const {width} = useWindowDimensions();
    const size = Math.floor((Math.min(width, MAX_CONTENT_WIDTH) - SCREEN_GUTTER * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

    return (
        <View className="flex-row flex-wrap" style={{gap: GAP}}>
            {cells.map(({episode, isWatched, isReleased, isNext}, index) => {
                const code = t("episodeCode", {season: episode.season_number, episode: episode.episode_number});
                return (
                    // The entrance sits on a wrapper so that its transform does not overwrite the press scale.
                    <AnimatedView key={episode.id} entering={enteringFor("pop", index)} style={{width: size, height: size}}>
                        <PressScale
                            role="checkbox"
                            aria-checked={isWatched}
                            aria-label={isWatched ? t("episodeActions.unmark", {code}) : t("episodeActions.mark", {code})}
                            disabled={!isReleased}
                            onPress={() => onToggle(episode)}
                            className={cn(
                                "h-full w-full items-center justify-center rounded-lg",
                                isWatched ? "bg-success" : "bg-surface",
                                isNext && "border-[1.5px] border-foreground",
                                !isReleased && "opacity-40",
                            )}
                        >
                            <Text className={cn("font-sans-medium text-[11px]", isWatched ? "text-background" : "text-muted-foreground")}>{episode.episode_number}</Text>
                        </PressScale>
                    </AnimatedView>
                );
            })}
        </View>
    );
};
