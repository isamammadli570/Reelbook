import {useContext, useMemo, type ComponentProps} from "react";
import {EntranceContext} from "@/components/motion/EntranceContext";
import {useReducedMotion} from "react-native-reanimated";
import {AnimatedView} from "@/components/ui/animated";
import {enteringFor, type RevealVariant} from "@/lib/motion";

type RevealProps = ComponentProps<typeof AnimatedView> & {
    /** Position in its list, so siblings enter one after another. */
    index?: number;
    variant?: RevealVariant;
    /** False skips the entrance, for items far down a long list. */
    isActive?: boolean;
};

/**
 * Plays its entrance once on mount. Users who asked for reduced motion get the content without movement, and
 * so do rows a long list mounts while scrolling (see `EntranceContext`).
 * The entrance is built once: a new one on each render would, on the web, cancel an entrance still running
 * when data arrives mid-way, and leave the content stuck invisible.
 */
export const Reveal = ({index = 0, variant = "rise", isActive = true, ...props}: RevealProps) => {
    const reduced = useReducedMotion();
    const isEntranceOn = useContext(EntranceContext);
    const entering = useMemo(
        () => (reduced || !isEntranceOn || !isActive ? undefined : enteringFor(variant, index)),
        [reduced, isEntranceOn, isActive, variant, index],
    );
    return <AnimatedView entering={entering} {...props}/>;
};
