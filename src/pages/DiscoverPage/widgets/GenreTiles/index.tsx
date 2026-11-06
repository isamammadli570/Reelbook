import {useEffect, useState} from "react";
import {Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {ChevronDown} from "lucide-react-native";
import {LinearTransition, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming} from "react-native-reanimated";
import {useCSSVariable} from "uniwind";
import {PopOnActivate} from "@/components/motion/PopOnActivate";
import {PressScale} from "@/components/motion/PressScale";
import {Reveal} from "@/components/motion/Reveal";
import {AnimatedView} from "@/components/ui/animated";
import {genresFor} from "@/helpers/discover";
import {GENRES, GENRES_SHOWN, type GenreTile} from "@/constants/genres";
import type {MediaFilter} from "@/constants/other";

type GenreTilesProps = {
    filter: MediaFilter;
    selected: GenreTile | null;
    onSelect: (genre: GenreTile | null) => void;
};

/**
 * Two-column colour tiles that rise in pairs: the most searched genres first, the rest behind "All genres".
 * The picked one pops, and tapping it again clears the genre. A picked tile from the hidden part keeps the
 * list open, so the choice never disappears from view.
 */
export const GenreTiles = ({filter, selected, onSelect}: GenreTilesProps) => {
    const {t} = useTranslation("discover");
    const foreground = String(useCSSVariable("--color-foreground"));
    const reduced = useReducedMotion();
    const [isOpen, setIsOpen] = useState(false);
    const tiles = genresFor(GENRES, filter);
    const selectedIndex = selected ? tiles.findIndex((genre) => genre.key === selected.key) : -1;
    const isExpanded = isOpen || selectedIndex >= GENRES_SHOWN;
    const visible = isExpanded ? tiles : tiles.slice(0, GENRES_SHOWN);

    // The arrow turns to point up once the list is open.
    const turn = useSharedValue(isExpanded ? 1 : 0);
    useEffect(() => {
        turn.value = reduced ? Number(isExpanded) : withTiming(Number(isExpanded), {duration: 220});
    }, [isExpanded, reduced, turn]);
    const arrow = useAnimatedStyle(() => ({transform: [{rotate: `${turn.value * 180}deg`}]}));

    return (
        <View className="gap-2.5">
            <AnimatedView layout={reduced ? undefined : LinearTransition.duration(260)} className="flex-row flex-wrap justify-between gap-y-2.5">
                {visible.map((genre, index) => {
                    const isSelected = selected?.key === genre.key;
                    // Tiles that open later rise in from the first of them, not after the six already showing.
                    const order = index >= GENRES_SHOWN ? index - GENRES_SHOWN : index;
                    return (
                        // Entrance and pop wrap the tile, so neither overwrites the press scale.
                        <Reveal key={genre.key} variant="rise" index={Math.floor(order / 2)} style={{width: "48%"}}>
                            <PopOnActivate active={isSelected}>
                                <PressScale
                                    scaleTo={0.98}
                                    role="button"
                                    aria-pressed={isSelected}
                                    onPress={() => onSelect(isSelected ? null : genre)}
                                    className="h-16 overflow-hidden rounded-2xl p-3.5"
                                    style={{backgroundColor: genre.bg, borderWidth: isSelected ? 1.5 : 0, borderColor: genre.fg}}
                                >
                                    <Text className="font-serif text-[22px] leading-[24px]" style={{color: genre.fg}}>{t(`genres.${genre.key}`)}</Text>
                                    <View
                                        aria-hidden
                                        style={{position: "absolute", bottom: -24, right: -14, width: 64, height: 64, borderRadius: 32, backgroundColor: genre.dot}}
                                    />
                                </PressScale>
                            </PopOnActivate>
                        </Reveal>
                    );
                })}
            </AnimatedView>
            {tiles.length > GENRES_SHOWN && selectedIndex < GENRES_SHOWN && (
                <PressScale
                    scaleTo={0.98}
                    onPress={() => setIsOpen((value) => !value)}
                    aria-expanded={isExpanded}
                    className="h-10 flex-row items-center justify-center gap-1.5 rounded-xl border border-border"
                >
                    <Text className="font-sans-medium text-[13px] text-foreground">{isExpanded ? t("fewerGenres") : t("allGenres")}</Text>
                    <AnimatedView style={arrow}>
                        <ChevronDown size={16} strokeWidth={2} color={foreground}/>
                    </AnimatedView>
                </PressScale>
            )}
        </View>
    );
};
