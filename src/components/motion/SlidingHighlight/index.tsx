import {useCallback, useEffect, useState, type ReactNode} from "react";
import type {LayoutChangeEvent} from "react-native";
import {
    interpolateColor,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withSpring,
    type SharedValue,
} from "react-native-reanimated";
import {useCSSVariable} from "uniwind";
import {AnimatedText, AnimatedView} from "@/components/ui/animated";
import {cn} from "@/lib/utils";

const SLIDE_SPRING = {damping: 20, stiffness: 220, mass: 0.7} as const;

type Box = {x: number; width: number};

/**
 * Measures a row of options and slides one highlight under the selected one, like the tab bar,
 * instead of each option drawing its own. Returns the highlight style, an `onLayout` per option,
 * and what `SlidingLabel` needs to recolour each label as the highlight passes under it.
 */
export const useSlidingHighlight = (selectedIndex: number) => {
    const reduced = useReducedMotion();
    const [boxes, setBoxes] = useState<Record<number, Box>>({});
    const x = useSharedValue(0);
    const width = useSharedValue(0);
    const opacity = useSharedValue(0);

    const measure = useCallback((index: number) => (event: LayoutChangeEvent) => {
        const {x: left, width: size} = event.nativeEvent.layout;
        setBoxes((current) => (current[index]?.x === left && current[index]?.width === size ? current : {...current, [index]: {x: left, width: size}}));
    }, []);

    const target = boxes[selectedIndex];

    useEffect(() => {
        if (!target) return;
        // The first placement jumps into position and fades in; later changes slide.
        const isFirst = opacity.value === 0;
        x.value = isFirst || reduced ? target.x : withSpring(target.x, SLIDE_SPRING);
        width.value = isFirst || reduced ? target.width : withSpring(target.width, SLIDE_SPRING);
        opacity.value = 1;
    }, [target, reduced, x, width, opacity]);

    const style = useAnimatedStyle(() => ({transform: [{translateX: x.value}], width: width.value, opacity: opacity.value}));

    return {style, measure, x, boxes};
};

type SlidingHighlightProps = {
    style: ReturnType<typeof useSlidingHighlight>["style"];
    className?: string;
};

/** The highlight itself; place it first inside the row so the options draw over it. */
export const SlidingHighlight = ({style, className}: SlidingHighlightProps) => (
    <AnimatedView pointerEvents="none" className={cn("absolute bottom-0 left-0 top-0", className)} style={style}/>
);

type SlidingLabelProps = {
    x: SharedValue<number>;
    box: Box | undefined;
    /** Colour tokens for the label off and on the highlight. */
    restColor: string;
    activeColor: string;
    className?: string;
    children: ReactNode;
};

/** A label whose colour follows how much of the highlight is under it, so it never reads dark on dark mid-slide. */
export const SlidingLabel = ({x, box, restColor, activeColor, className, children}: SlidingLabelProps) => {
    const [rest, active] = useCSSVariable([restColor, activeColor]).map(String);

    const style = useAnimatedStyle(() => {
        if (!box) return {color: rest};
        const overlap = Math.max(0, 1 - Math.abs(x.value - box.x) / box.width);
        return {color: interpolateColor(overlap, [0, 1], [rest, active])};
    });

    return <AnimatedText className={className} style={style}>{children}</AnimatedText>;
};
