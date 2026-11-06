import {useEffect} from "react";
import {Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming} from "react-native-reanimated";
import {AnimatedView} from "@/components/ui/animated";
import {cn} from "@/lib/utils";

type ProgressBarProps = {
    percent: number;
    className?: string;
    fillClassName?: string;
    /** Wait before growing, so bars in a list fill one after another. */
    delay?: number;
};

/** A thin rounded progress track; the fill grows in from empty when shown, then glides to any new value. */
export const ProgressBar = ({percent, className, fillClassName, delay = 0}: ProgressBarProps) => {
    const target = Math.min(100, Math.max(0, percent));
    const reduced = useReducedMotion();
    const width = useSharedValue(reduced ? target : 0);

    useEffect(() => {
        width.value = reduced ? target : withDelay(delay, withTiming(target, {duration: 700, easing: Easing.out(Easing.cubic)}));
    }, [target, reduced, width, delay]);

    const fillStyle = useAnimatedStyle(() => ({width: `${width.value}%`}));

    return (
        <AnimatedView role="progressbar" aria-valuenow={target} aria-valuemin={0} aria-valuemax={100} className={cn("h-1.5 overflow-hidden rounded-full bg-surface-raised", className)}>
            <AnimatedView className={cn("h-full rounded-full bg-success", fillClassName)} style={fillStyle}/>
        </AnimatedView>
    );
};
