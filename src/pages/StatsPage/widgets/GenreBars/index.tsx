import {Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {ProgressBar} from "@/widgets/ProgressBar";
import {Section} from "@/widgets/Section";
import {translateGenre} from "@/helpers/genres";

// Fading shades of the brand colour, strongest for the top genre.
const FILLS = ["bg-brand", "bg-brand/70", "bg-brand/45"];

type GenreBarsProps = {genres: {name: string; percent: number}[]};

/** The top genres by share of watch time. */
export const GenreBars = ({genres}: GenreBarsProps) => {
    const {t, i18n} = useTranslation("stats");
    if (!genres.length) return null;

    return (
        <Section title={t("genres")}>
            <View className="gap-3">
                {genres.map((genre, index) => (
                    <View key={genre.name} className="gap-1.5">
                        <View className="flex-row justify-between">
                            <Text className="font-sans-medium text-[13px] text-foreground">{translateGenre(genre.name, i18n.language)}</Text>
                            <Text className="font-sans text-[13px] text-muted-foreground">{genre.percent}%</Text>
                        </View>
                        <ProgressBar percent={genre.percent} className="h-2 bg-surface" fillClassName={FILLS[index] ?? FILLS.at(-1)}/>
                    </View>
                ))}
            </View>
        </Section>
    );
};
