import {View} from "react-native";
import {cn} from "@/lib/utils";

type ProgressBarProps = {
    percent: number;
    className?: string;
    fillClassName?: string;
};

/** A thin rounded progress track. */
export const ProgressBar = ({percent, className, fillClassName}: ProgressBarProps) => (
    <View role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} className={cn("h-1.5 overflow-hidden rounded-full bg-surface-raised", className)}>
        <View className={cn("h-full rounded-full bg-success", fillClassName)} style={{width: `${Math.min(100, Math.max(0, percent))}%`}}/>
    </View>
);
