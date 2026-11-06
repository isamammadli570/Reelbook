import {useEffect, useState} from "react";
import {Easing, useReducedMotion, useSharedValue, withSpring, withTiming, type SharedValue} from "react-native-reanimated";
import {scheduleOnRN} from "react-native-worklets";

const ENTER_SPRING = {damping: 22, stiffness: 240, mass: 0.8} as const;
const EXIT_MS = 200;

/**
 * Keeps a modal mounted while it animates out. `Modal` unmounts its content the moment it is hidden,
 * so an exit animation never plays; this delays the unmount until `progress` has run back to 0.
 * `progress` goes 0 → 1 on open and drives the backdrop and the panel on the UI thread.
 */
export const useModalPresence = (isOpen: boolean): {isRendered: boolean; progress: SharedValue<number>} => {
    const reduced = useReducedMotion();
    const [isRendered, setIsRendered] = useState(isOpen);
    const progress = useSharedValue(0);

    // Mount as soon as it opens; the exit below unmounts it again.
    if (isOpen && !isRendered) setIsRendered(true);

    useEffect(() => {
        if (isOpen) {
            progress.value = reduced ? 1 : withSpring(1, ENTER_SPRING);
            return;
        }
        // With reduced motion the exit takes no time but still unmounts through the same callback.
        progress.value = withTiming(0, {duration: reduced ? 0 : EXIT_MS, easing: Easing.in(Easing.cubic)}, (finished) => {
            if (finished) scheduleOnRN(setIsRendered, false);
        });
    }, [isOpen, reduced, progress]);

    return {isRendered, progress};
};
