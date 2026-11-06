import type {ComponentProps} from "react";
import {useReducedMotion} from "react-native-reanimated";
import {AnimatedView} from "@/components/ui/animated";
import {enteringFor, type RevealVariant} from "@/lib/motion";

type RevealProps = ComponentProps<typeof AnimatedView> & {
    /** Position in its list, so siblings enter one after another. */
    index?: number;
    variant?: RevealVariant;
};

/** Plays its entrance once on mount. Users who asked for reduced motion get the content without movement. */
export const Reveal = ({index = 0, variant = "rise", ...props}: RevealProps) => {
    const reduced = useReducedMotion();
    return <AnimatedView entering={reduced ? undefined : enteringFor(variant, index)} {...props}/>;
};
