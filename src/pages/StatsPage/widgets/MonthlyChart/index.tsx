import {Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {Reveal} from "@/components/motion/Reveal";
import {useDateFormat} from "@/hooks/useDateFormat";
import {cn} from "@/lib/utils";

const BAR_AREA_HEIGHT = 96;
const MIN_BAR_HEIGHT = 4;

type MonthlyChartProps = {
    year: number;
    minutes: number[];
};

/** Twelve bars of hours watched per month; they grow in one after another, the busiest month in the brand colour. */
export const MonthlyChart = ({year, minutes}: MonthlyChartProps) => {
    const {t} = useTranslation("stats");
    const {monthName} = useDateFormat();
    const max = Math.max(...minutes);
    const peak = max > 0 ? minutes.indexOf(max) : -1;

    return (
        <View className="gap-3 rounded-2xl bg-surface p-4">
            <View className="flex-row items-baseline justify-between">
                <Text className="font-sans-medium text-sm text-foreground">{t("monthly")}</Text>
                {peak >= 0 && <Text className="font-sans text-xs text-brand">{t("mostActive", {month: monthName(peak)})}</Text>}
            </View>
            <View className="flex-row items-end gap-1.5">
                {minutes.map((value, month) => {
                    const height = max > 0 ? Math.max(MIN_BAR_HEIGHT, Math.round((value / max) * BAR_AREA_HEIGHT)) : MIN_BAR_HEIGHT;
                    const isPeak = month === peak;
                    return (
                        <View key={month} className="flex-1 items-center gap-1.5" aria-label={`${monthName(month)} ${year}: ${t("hours", {count: Math.round(value / 60)})}`}>
                            <Reveal index={month} variant="rise" className={cn("w-full rounded-[5px]", isPeak ? "bg-brand" : value > 0 ? "bg-surface-raised" : "bg-background")} style={{height}}/>
                            <Text className={cn("font-sans text-[11px]", isPeak ? "text-brand" : "text-muted-foreground")}>{monthName(month).charAt(0)}</Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};
