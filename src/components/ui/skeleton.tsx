import {useEffect} from "react";
import {type ViewProps} from "react-native";
import {Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming} from "react-native-reanimated";
import {AnimatedView} from "@/components/ui/animated";
import {cn} from "@/lib/utils";

/** A placeholder block that breathes gently while its content loads. */
export const Skeleton = ({className, style, ...props}: ViewProps) => {
    const opacity = useSharedValue(0.55);
    const reduced = useReducedMotion();

    useEffect(() => {
        if (reduced) return;
        opacity.value = withRepeat(withTiming(1, {duration: 900, easing: Easing.inOut(Easing.ease)}), -1, true);
    }, [opacity, reduced]);

    const pulse = useAnimatedStyle(() => ({opacity: opacity.value}));

    return <AnimatedView className={cn("rounded-lg bg-surface", className)} style={[style, pulse]} {...props}/>;
};
