import {useCallback} from "react";
import {interpolateColor, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming} from "react-native-reanimated";
import {useCSSVariable} from "uniwind";

/**
 * A field's border that brightens while it has focus, and turns red when it has an error.
 * Spread `handlers` on the input and put `style` on the animated frame around it.
 */
export const useFocusRing = (hasError = false) => {
    const reduced = useReducedMotion();
    const [rest, focus, danger] = useCSSVariable(["--color-border", "--color-muted-foreground", "--color-danger"]).map(String);
    const focused = useSharedValue(0);

    const onFocus = useCallback(() => {
        focused.set(reduced ? 1 : withTiming(1, {duration: 180}));
    }, [focused, reduced]);
    const onBlur = useCallback(() => {
        focused.set(reduced ? 0 : withTiming(0, {duration: 220}));
    }, [focused, reduced]);

    const style = useAnimatedStyle(() => ({
        borderColor: hasError ? danger : interpolateColor(focused.value, [0, 1], [rest, focus]),
    }));

    return {style, onFocus, onBlur};
};
