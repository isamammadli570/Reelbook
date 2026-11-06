import {useMemo, type ComponentProps} from "react";
import {useReducedMotion} from "react-native-reanimated";
import {AnimatedView} from "@/components/ui/animated";
import {enteringFor, type RevealVariant} from "@/lib/motion";

type RevealProps = ComponentProps<typeof AnimatedView> & {
    /** Position in its list, so siblings enter one after another. */
    index?: number;
    variant?: RevealVariant;
};

/**
 * Plays its entrance once on mount. Users who asked for reduced motion get the content without movement.
 * The entrance is built once: a new one on each render would, on the web, cancel an entrance still running
 * when data arrives mid-way, and leave the content stuck invisible.
 */
export const Reveal = ({index = 0, variant = "rise", ...props}: RevealProps) => {
    const reduced = useReducedMotion();
    const entering = useMemo(() => (reduced ? undefined : enteringFor(variant, index)), [reduced, variant, index]);
    return <AnimatedView entering={entering} {...props}/>;
};
