import {Text, View} from "react-native";
import {Reveal} from "@/components/motion/Reveal";
import {useDateFormat} from "@/hooks/useDateFormat";
import {toIsoDay} from "@/helpers/calendar";
import {cn} from "@/lib/utils";

type WeekStripProps = {
    days: Date[];
    today: Date;
    daysWithEpisodes: Set<string>;
};

/** Seven days from today; a dot marks the days that have something airing. The days pop in as a wave. */
export const WeekStrip = ({days, today, daysWithEpisodes}: WeekStripProps) => {
    const {weekdayShort} = useDateFormat();
    const todayKey = toIsoDay(today);

    return (
        <View className="flex-row gap-1.5">
            {days.map((day, index) => {
                const key = toIsoDay(day);
                const isToday = key === todayKey;
                const hasEpisodes = daysWithEpisodes.has(key);
                return (
                    <Reveal key={key} index={index} variant="pop" className={cn("h-[76px] flex-1 items-center justify-center gap-1 rounded-2xl", isToday ? "bg-brand" : "bg-surface")}>
                        <Text className={cn("font-sans-medium text-[11px]", isToday ? "text-brand-ink" : "text-muted-foreground")}>{weekdayShort(day)}</Text>
                        <Text className={cn("font-sans-semibold text-lg", isToday ? "text-brand-ink" : "text-foreground")}>{day.getDate()}</Text>
                        <View className={cn("h-1 w-1 rounded-full", hasEpisodes ? (isToday ? "bg-brand-ink" : "bg-brand") : "bg-transparent")}/>
                    </Reveal>
                );
            })}
        </View>
    );
};
