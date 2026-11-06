import {
    FadeIn,
    FadeInDown,
    FadeInUp,
    ZoomIn,
    type EntryOrExitLayoutType,
} from "react-native-reanimated";

/** One set of timings for the whole app, so every element moves with the same rhythm. */
export const MOTION = {
    duration: 360,
    stagger: 40,
    /** Items past this index appear together; a long grid should not wait a second for its last poster. */
    maxStagger: 10,
    pressScale: 0.96,
} as const;

export const SPRING = {damping: 18, stiffness: 260, mass: 0.7} as const;

export type RevealVariant = "rise" | "fade" | "drop" | "pop";

export const staggerDelay = (index: number): number => Math.min(index, MOTION.maxStagger) * MOTION.stagger;

const build = (variant: RevealVariant, delay: number): EntryOrExitLayoutType => {
    switch (variant) {
        case "fade":
            return FadeIn.duration(MOTION.duration).delay(delay);
        case "drop":
            return FadeInDown.duration(MOTION.duration).delay(delay);
        case "pop":
            return ZoomIn.duration(MOTION.duration).delay(delay);
        case "rise":
            return FadeInUp.duration(MOTION.duration).delay(delay);
    }
};

/**
 * The entering animation for one reveal variant, delayed by its position in a list.
 * Each component needs its own object, kept for its lifetime (`Reveal` memoises it): one shared between
 * components never plays on the web, and a fresh one per render cancels an entrance still running.
 */
export const enteringFor = (variant: RevealVariant, index: number): EntryOrExitLayoutType => build(variant, staggerDelay(index));
