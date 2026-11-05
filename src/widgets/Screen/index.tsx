import type {ReactNode} from "react";
import {ScrollView, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {MAX_CONTENT_WIDTH} from "@/constants/other";
import {TAB_BAR_HEIGHT, TAB_BAR_OFFSET} from "@/layout/TabBar";

type ScreenProps = {children: ReactNode};

/** Scrollable page body: clears the notch and the floating tab bar, and stays phone-width on web. */
export const Screen = ({children}: ScreenProps) => {
    const insets = useSafeAreaInsets();

    return (
        <ScrollView className="flex-1 bg-background" contentContainerClassName="items-center" showsVerticalScrollIndicator={false}>
            <View
                className="w-full gap-6 px-5"
                style={{maxWidth: MAX_CONTENT_WIDTH, paddingTop: insets.top + 16, paddingBottom: insets.bottom + TAB_BAR_HEIGHT + TAB_BAR_OFFSET + 24}}
            >
                {children}
            </View>
        </ScrollView>
    );
};
