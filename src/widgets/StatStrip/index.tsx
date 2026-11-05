import {Text, View} from "react-native";
import {cn} from "@/lib/utils";

export type Stat = {value: string; label: string};

type StatStripProps = {stats: Stat[]};

/** A row of big numbers with small labels, split by hairlines. */
export const StatStrip = ({stats}: StatStripProps) => (
    <View className="flex-row rounded-2xl bg-surface py-3">
        {stats.map((stat, index) => (
            <View key={stat.label} className={cn("flex-1 items-center gap-0.5 px-1", index > 0 && "border-l border-border")}>
                <Text className="font-sans-semibold text-xl text-foreground" numberOfLines={1}>{stat.value}</Text>
                <Text className="text-center font-sans text-[11px] text-muted-foreground" numberOfLines={1}>{stat.label}</Text>
            </View>
        ))}
    </View>
);
