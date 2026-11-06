import type {ComponentProps} from "react";
import type {PressableProps} from "react-native";
import {useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming} from "react-native-reanimated";
import {AnimatedPressable} from "@/components/ui/animated";
import {MOTION, SPRING} from "@/lib/motion";

type PressScaleProps = Omit<ComponentProps<typeof AnimatedPressable>, "onPressIn" | "onPressOut"> &
    Pick<PressableProps, "onPressIn" | "onPressOut"> & {
        /** How small it gets while held; rows and wide cards use a gentler value than buttons. */
        scaleTo?: number;
        /** Also fades while held, for text links that are too small to read a scale. */
        dimTo?: number;
    };

/** A pressable that springs smaller while held, so every tap answers before it completes. Runs on the UI thread. */
export const PressScale = ({onPressIn, onPressOut, style, scaleTo = MOTION.pressScale, dimTo = 1, ...props}: PressScaleProps) => {
    const pressed = useSharedValue(0);
    const reduced = useReducedMotion();

    const pressStyle = useAnimatedStyle(() => ({
        transform: [{scale: 1 - pressed.value * (1 - scaleTo)}],
        opacity: 1 - pressed.value * (1 - dimTo),
    }));

    return (
        <AnimatedPressable
            {...props}
            style={[style, reduced ? undefined : pressStyle]}
            onPressIn={(event) => {
                pressed.value = withSpring(1, SPRING);
                onPressIn?.(event);
            }}
            onPressOut={(event) => {
                // Letting go eases back rather than springing, so a quick tap does not wobble.
                pressed.value = withTiming(0, {duration: 180});
                onPressOut?.(event);
            }}
        />
    );
};
