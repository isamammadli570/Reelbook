import {createContext, useContext, type ReactNode} from "react";
import {Extrapolation, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, type SharedValue} from "react-native-reanimated";

/** How far the page has scrolled, shared with anything inside it that moves with the scroll. */
const ScrollYContext = createContext<SharedValue<number> | null>(null);

export const ScrollYProvider = ({value, children}: {value: SharedValue<number>; children: ReactNode}) => (
    <ScrollYContext.Provider value={value}>{children}</ScrollYContext.Provider>
);

/**
 * Motion for a header image of the given height, in two parts:
 * - `frame` (the clipped box): stretches from its bottom edge when the page is pulled past the top (iOS bounce);
 * - `image` (inside the box): drifts down at half speed as the page scrolls up, so it seems further away.
 * Keeping the drift inside the clip stops the image from sliding under the text below it.
 */
export const useParallax = (height: number) => {
    const scrollY = useContext(ScrollYContext);
    const fallback = useSharedValue(0);
    const y = scrollY ?? fallback;
    const reduced = useReducedMotion();

    const frame = useAnimatedStyle(() => {
        if (reduced || y.value >= 0) return {transform: [{translateY: 0}, {scale: 1}]};
        // Moving up by half the pull while growing by all of it keeps the bottom edge fixed and fills the gap above.
        return {transform: [{translateY: y.value / 2}, {scale: 1 + -y.value / height}]};
    });

    const image = useAnimatedStyle(() => {
        if (reduced) return {transform: [{translateY: 0}]};
        return {transform: [{translateY: interpolate(y.value, [0, height], [0, height / 2], Extrapolation.CLAMP)}]};
    });

    return {frame, image};
};
