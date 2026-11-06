import {useEffect, useRef, type ReactNode} from "react";
import {useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring} from "react-native-reanimated";
import {AnimatedView} from "@/components/ui/animated";
import {SPRING} from "@/lib/motion";

type PopOnActivateProps = {
    /** Pops once each time this turns on, e.g. a star filled or a heart liked. */
    active: boolean;
    children: ReactNode;
};

export const PopOnActivate = ({active, children}: PopOnActivateProps) => {
    const scale = useSharedValue(1);
    const reduced = useReducedMotion();
    const wasActive = useRef(active);

    useEffect(() => {
        if (active && !wasActive.current && !reduced) {
            scale.value = withSequence(withSpring(1.28, SPRING), withSpring(1, SPRING));
        }
        wasActive.current = active;
    }, [active, reduced, scale]);

    const popStyle = useAnimatedStyle(() => ({transform: [{scale: scale.value}]}));

    return <AnimatedView style={popStyle}>{children}</AnimatedView>;
};
