import type {ReactNode} from "react";
import {View} from "react-native";
import Animated, {useAnimatedScrollHandler, useSharedValue} from "react-native-reanimated";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useCSSVariable} from "uniwind";
import {ScrollYProvider} from "@/components/motion/ScrollContext";
import {MAX_CONTENT_WIDTH} from "@/constants/other";
import {TAB_BAR_HEIGHT, TAB_BAR_OFFSET} from "@/layout/TabBar";
import {cn} from "@/lib/utils";

type ScreenProps = {
    children: ReactNode;
    /** For pages that start with a full-width image under the notch; children then pad themselves. */
    isEdgeToEdge?: boolean;
};

/**
 * Scrollable page body: clears the notch and the floating tab bar, and stays phone-width on web.
 * Edge-to-edge pages share their scroll position so a cover image can move with it.
 */
export const Screen = ({children, isEdgeToEdge}: ScreenProps) => {
    const insets = useSafeAreaInsets();
    const background = String(useCSSVariable("--color-background"));
    const scrollY = useSharedValue(0);
    const onScroll = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    return (
        <ScrollYProvider value={scrollY}>
            <Animated.ScrollView
                // Only cover pages use the position; the others skip the per-frame work.
                onScroll={isEdgeToEdge ? onScroll : undefined}
                scrollEventThrottle={16}
                style={{flex: 1, backgroundColor: background}}
                contentContainerStyle={{alignItems: "center"}}
                showsVerticalScrollIndicator={false}
                // With the keyboard open (searching), the first tap on a result opens it instead of only closing the
                // keyboard; scrolling the results tucks the keyboard away.
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            >
                <View
                    className={cn("w-full gap-6", !isEdgeToEdge && "px-5")}
                    style={{
                        maxWidth: MAX_CONTENT_WIDTH,
                        paddingTop: isEdgeToEdge ? 0 : insets.top + 16,
                        paddingBottom: insets.bottom + TAB_BAR_HEIGHT + TAB_BAR_OFFSET + 24,
                    }}
                >
                    {children}
                </View>
            </Animated.ScrollView>
        </ScrollYProvider>
    );
};
