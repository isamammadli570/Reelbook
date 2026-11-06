import type {ComponentProps} from "react";
import type {PressableProps} from "react-native";
import {useAnimatedStyle, useReducedMotion, useSharedValue, withSpring} from "react-native-reanimated";
import {AnimatedPressable} from "@/components/ui/animated";
import {MOTION, SPRING} from "@/lib/motion";

type PressScaleProps = Omit<ComponentProps<typeof AnimatedPressable>, "onPressIn" | "onPressOut"> &
    Pick<PressableProps, "onPressIn" | "onPressOut">;

/** A pressable that springs smaller while held, so every tap answers before it completes. */
export const PressScale = ({onPressIn, onPressOut, style, ...props}: PressScaleProps) => {
    const pressed = useSharedValue(0);
    const reduced = useReducedMotion();

    const pressStyle = useAnimatedStyle(() => ({
        transform: [{scale: 1 - pressed.value * (1 - MOTION.pressScale)}],
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
                pressed.value = withSpring(0, SPRING);
                onPressOut?.(event);
            }}
        />
    );
};
