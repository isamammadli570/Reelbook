import {Text, View} from "react-native";
import {CountUp, parsePlainNumber} from "@/components/motion/CountUp";
import {Reveal} from "@/components/motion/Reveal";
import {cn} from "@/lib/utils";

export type Stat = {value: string; label: string};

type StatStripProps = {stats: Stat[]};

/** A row of big numbers with small labels, split by hairlines; plain numbers count up as the row appears. */
const StatValue = ({value}: {value: string}) => {
    const number = parsePlainNumber(value);
    const className = "font-sans-semibold text-xl text-foreground";
    return number
        ? <CountUp value={number.value} decimals={number.decimals} className={className} numberOfLines={1}/>
        : <Text className={className} numberOfLines={1}>{value}</Text>;
};

export const StatStrip = ({stats}: StatStripProps) => (
    <View className="flex-row rounded-2xl bg-surface py-3">
        {stats.map((stat, index) => (
            <Reveal key={stat.label} index={index} variant="fade" className={cn("flex-1 items-center gap-0.5 px-1", index > 0 && "border-l border-border")}>
                <StatValue value={stat.value}/>
                <Text className="text-center font-sans text-[11px] text-muted-foreground" numberOfLines={1}>{stat.label}</Text>
            </Reveal>
        ))}
    </View>
);
