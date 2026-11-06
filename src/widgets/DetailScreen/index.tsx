import type {ReactNode} from "react";
import {View} from "react-native";
import Animated, {useAnimatedScrollHandler, useSharedValue} from "react-native-reanimated";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useCSSVariable} from "uniwind";
import {ScrollYProvider} from "@/components/motion/ScrollContext";
import {MAX_CONTENT_WIDTH} from "@/constants/other";

type DetailScreenProps = {children: ReactNode};

/**
 * Scroll body of a movie, series or person page: no tab bar, and the hero runs edge to edge under the notch.
 * The scroll position is tracked on the UI thread so the hero can move with it.
 */
export const DetailScreen = ({children}: DetailScreenProps) => {
    const insets = useSafeAreaInsets();
    const background = String(useCSSVariable("--color-background"));
    const scrollY = useSharedValue(0);
    const onScroll = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    return (
        <ScrollYProvider value={scrollY}>
            <Animated.ScrollView
                onScroll={onScroll}
                scrollEventThrottle={16}
                style={{flex: 1, backgroundColor: background}}
                contentContainerStyle={{alignItems: "center"}}
                showsVerticalScrollIndicator={false}
            >
                <View className="w-full gap-6" style={{maxWidth: MAX_CONTENT_WIDTH, paddingBottom: insets.bottom + 40}}>
                    {children}
                </View>
            </Animated.ScrollView>
        </ScrollYProvider>
    );
};

type DetailBodyProps = {children: ReactNode};

/** The padded column under the hero. */
export const DetailBody = ({children}: DetailBodyProps) => <View className="gap-7 px-5">{children}</View>;
