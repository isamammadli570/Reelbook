import {Pressable, Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {GENRES, type GenreTile} from "@/constants/genres";

type GenreTilesProps = {
    selected: GenreTile | null;
    onSelect: (genre: GenreTile | null) => void;
};

/** Two-column colour tiles; tapping the selected one clears the genre. */
export const GenreTiles = ({selected, onSelect}: GenreTilesProps) => {
    const {t} = useTranslation("discover");

    return (
        <View className="flex-row flex-wrap justify-between gap-y-2.5">
            {GENRES.map((genre) => {
                const isSelected = selected?.key === genre.key;
                return (
                    <Pressable
                        key={genre.key}
                        role="button"
                        aria-pressed={isSelected}
                        onPress={() => onSelect(isSelected ? null : genre)}
                        className="h-16 overflow-hidden rounded-2xl p-3.5"
                        style={{width: "48%", backgroundColor: genre.bg, borderWidth: isSelected ? 1.5 : 0, borderColor: genre.fg}}
                    >
                        <Text className="font-serif text-[22px] leading-[24px]" style={{color: genre.fg}}>{t(`genres.${genre.key}`)}</Text>
                        <View
                            aria-hidden
                            style={{position: "absolute", bottom: -24, right: -14, width: 64, height: 64, borderRadius: 32, backgroundColor: genre.dot}}
                        />
                    </Pressable>
                );
            })}
        </View>
    );
};
