import {useEffect} from "react";
import {Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming} from "react-native-reanimated";
import {AnimatedView} from "@/components/ui/animated";
import {cn} from "@/lib/utils";

type ProgressBarProps = {
    percent: number;
    className?: string;
    fillClassName?: string;
};

/** A thin rounded progress track; the fill glides to its new value instead of jumping. */
export const ProgressBar = ({percent, className, fillClassName}: ProgressBarProps) => {
    const target = Math.min(100, Math.max(0, percent));
    const width = useSharedValue(target);
    const reduced = useReducedMotion();

    useEffect(() => {
        width.value = reduced ? target : withTiming(target, {duration: 650, easing: Easing.out(Easing.cubic)});
    }, [target, reduced, width]);

    const fillStyle = useAnimatedStyle(() => ({width: `${width.value}%`}));

    return (
        <AnimatedView role="progressbar" aria-valuenow={target} aria-valuemin={0} aria-valuemax={100} className={cn("h-1.5 overflow-hidden rounded-full bg-surface-raised", className)}>
            <AnimatedView className={cn("h-full rounded-full bg-success", fillClassName)} style={fillStyle}/>
        </AnimatedView>
    );
};
