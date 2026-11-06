import {useEffect} from "react";
import {Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming} from "react-native-reanimated";
import {AnimatedView} from "@/components/ui/animated";
import {staggerDelay} from "@/lib/motion";

type GrowBarProps = {
    height: number;
    index?: number;
    className?: string;
};

/** A chart bar that grows up from the baseline to its height, after the bars before it; it glides when the data changes. */
export const GrowBar = ({height, index = 0, className}: GrowBarProps) => {
    const reduced = useReducedMotion();
    const current = useSharedValue(reduced ? height : 0);

    useEffect(() => {
        current.value = reduced ? height : withDelay(staggerDelay(index), withTiming(height, {duration: 650, easing: Easing.out(Easing.cubic)}));
    }, [height, index, reduced, current]);

    const style = useAnimatedStyle(() => ({height: current.value}));

    return <AnimatedView className={className} style={style}/>;
};
