import {Pressable} from "react-native";
import Animated from "react-native-reanimated";
import {withUniwind} from "uniwind";

/** Animated primitives that still accept `className`, so motion does not fight the design tokens. */
export const AnimatedView = withUniwind(Animated.View);
export const AnimatedText = withUniwind(Animated.Text);
export const AnimatedPressable = withUniwind(Animated.createAnimatedComponent(Pressable));
