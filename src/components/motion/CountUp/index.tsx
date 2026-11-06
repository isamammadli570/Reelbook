import {useEffect, useRef, useState, type ComponentProps} from "react";
import {Text} from "react-native";
import {useReducedMotion} from "react-native-reanimated";

const DURATION_MS = 900;

/** Fast at first, settling on the value: reads as counting rather than as a timer. */
const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

type CountUpProps = Omit<ComponentProps<typeof Text>, "children"> & {
    value: number;
    format?: (value: number) => string;
    /** Digits after the point while counting, so 8.4 counts as 0.0 → 8.4, not 0 → 8. */
    decimals?: number;
};

/**
 * A number that counts up to its value when it first shows and glides to any new value after.
 * Only a handful appear per screen, so a frame loop on the JS thread costs nothing noticeable.
 */
export const CountUp = ({value, format, decimals = 0, ...props}: CountUpProps) => {
    const reduced = useReducedMotion();
    const [shown, setShown] = useState(reduced ? value : 0);
    const from = useRef(reduced ? value : 0);

    useEffect(() => {
        if (reduced) return;
        const start = from.current;
        const startedAt = Date.now();
        let frame = 0;
        const tick = () => {
            const progress = Math.min(1, (Date.now() - startedAt) / DURATION_MS);
            const next = start + (value - start) * easeOutCubic(progress);
            from.current = next;
            setShown(next);
            if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [value, reduced]);

    // With reduced motion the value shows as it is, with no counting.
    const rounded = Number((reduced ? value : shown).toFixed(decimals));
    return <Text {...props}>{format ? format(rounded) : rounded.toFixed(decimals)}</Text>;
};

/** "8.4" → 8.4 with one decimal; anything with words or units is not a plain number and is shown as it is. */
export const parsePlainNumber = (text: string): {value: number; decimals: number} | null => {
    const match = /^(\d+)(?:\.(\d+))?$/.exec(text.trim());
    if (!match) return null;
    return {value: Number(text), decimals: match[2]?.length ?? 0};
};
