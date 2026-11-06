import {Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {GrowBar} from "@/components/motion/GrowBar";
import {formatStars} from "@/helpers/library";
import {RATING_STEPS} from "@/helpers/stats";
import {cn} from "@/lib/utils";

const BAR_AREA_HEIGHT = 72;
const MIN_BAR_HEIGHT = 3;

type RatingChartProps = {counts: number[]; total: number; average: number | null};

/**
 * Ten bars, half a star to five stars, of how many titles got each rating; the rating given most is in the
 * brand colour. The stars at either end read the scale, as on Letterboxd.
 */
export const RatingChart = ({counts, total, average}: RatingChartProps) => {
    const {t} = useTranslation("stats");
    if (!total) return null;
    const max = Math.max(...counts);
    const peak = counts.indexOf(max);

    return (
        <View className="gap-3 rounded-2xl bg-surface p-4">
            <View className="flex-row items-baseline justify-between">
                <Text className="font-sans-medium text-sm text-foreground">{t("ratings.title")}</Text>
                <Text className="font-sans text-xs text-muted-foreground">
                    {average !== null ? t("ratings.summary", {count: total, average: average.toFixed(1)}) : t("ratings.count", {count: total})}
                </Text>
            </View>
            <View className="flex-row items-end gap-2">
                <Text className="pb-0.5 font-sans text-[11px] text-brand">★</Text>
                <View className="min-w-0 flex-1 flex-row items-end gap-1">
                    {counts.map((count, index) => {
                        const height = max > 0 ? Math.max(MIN_BAR_HEIGHT, Math.round((count / max) * BAR_AREA_HEIGHT)) : MIN_BAR_HEIGHT;
                        const stars = RATING_STEPS[index];
                        return (
                            <View key={stars} className="flex-1" aria-label={t("ratings.bar", {stars: formatStars(stars), count})}>
                                <GrowBar index={index} height={height} className={cn("w-full rounded-t-[4px]", index === peak ? "bg-brand" : count > 0 ? "bg-surface-raised" : "bg-background")}/>
                            </View>
                        );
                    })}
                </View>
                <Text className="pb-0.5 font-sans text-[11px] text-brand">★★★★★</Text>
            </View>
            <Text className="font-sans text-xs text-muted-foreground">{t("ratings.mostGiven", {stars: formatStars(RATING_STEPS[peak]), count: max})}</Text>
        </View>
    );
};
