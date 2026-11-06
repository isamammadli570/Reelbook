import {Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {Reveal} from "@/components/motion/Reveal";
import {splitWatchTime, type StatsSummary} from "@/helpers/stats";

type WatchStatsProps = {summary: StatsSummary};

/** Watch time and counts as cards, the first thing under the name. */
export const WatchStats = ({summary}: WatchStatsProps) => {
    const {t} = useTranslation("profile");
    const {months, days, hours} = splitWatchTime(summary.minutes);
    const watchTime = [
        months ? t("watchTime.months", {count: months}) : null,
        months || days ? t("watchTime.days", {count: days}) : null,
        t("watchTime.hours", {count: hours}),
    ].filter(Boolean).join(" ");

    const cards = [
        {label: t("cards.watchTime"), value: watchTime},
        {label: t("cards.movies"), value: summary.movies.toLocaleString()},
        {label: t("cards.episodes"), value: summary.episodes.toLocaleString()},
    ];

    return (
        <View className="flex-row gap-2.5">
            {cards.map((card, index) => (
                <Reveal key={card.label} index={index} variant="rise" className={index === 0 ? "flex-[1.6] gap-1.5 rounded-2xl bg-surface p-3.5" : "flex-1 gap-1.5 rounded-2xl bg-surface p-3.5"}>
                    <Text className="font-sans-semibold text-[11px] uppercase tracking-wider text-muted-foreground" numberOfLines={1}>{card.label}</Text>
                    <Text className="font-sans-semibold text-lg text-foreground" numberOfLines={1} adjustsFontSizeToFit>{card.value}</Text>
                </Reveal>
            ))}
        </View>
    );
};
