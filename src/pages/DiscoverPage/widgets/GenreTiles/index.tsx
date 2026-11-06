import {Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {PopOnActivate} from "@/components/motion/PopOnActivate";
import {PressScale} from "@/components/motion/PressScale";
import {AnimatedView} from "@/components/ui/animated";
import {enteringFor} from "@/lib/motion";
import {GENRES, type GenreTile} from "@/constants/genres";

type GenreTilesProps = {
    selected: GenreTile | null;
    onSelect: (genre: GenreTile | null) => void;
};

/** Two-column colour tiles that rise in pairs; the picked one pops, and tapping it again clears the genre. */
export const GenreTiles = ({selected, onSelect}: GenreTilesProps) => {
    const {t} = useTranslation("discover");

    return (
        <View className="flex-row flex-wrap justify-between gap-y-2.5">
            {GENRES.map((genre, index) => {
                const isSelected = selected?.key === genre.key;
                return (
                    // Entrance and pop wrap the tile, so neither overwrites the press scale.
                    <AnimatedView key={genre.key} entering={enteringFor("rise", Math.floor(index / 2))} style={{width: "48%"}}>
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
                    </AnimatedView>
                );
            })}
        </View>
    );
};
