import type {ReactNode} from "react";
import {ScrollView, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {MAX_CONTENT_WIDTH} from "@/constants/other";

type DetailScreenProps = {children: ReactNode};

/** Scroll body of a movie or series page: no tab bar, and the hero runs edge to edge under the notch. */
export const DetailScreen = ({children}: DetailScreenProps) => {
    const insets = useSafeAreaInsets();

    return (
        <ScrollView className="flex-1 bg-background" contentContainerClassName="items-center" showsVerticalScrollIndicator={false}>
            <View className="w-full gap-6" style={{maxWidth: MAX_CONTENT_WIDTH, paddingBottom: insets.bottom + 40}}>
                {children}
            </View>
        </ScrollView>
    );
};

type DetailBodyProps = {children: ReactNode};

/** The padded column under the hero. */
export const DetailBody = ({children}: DetailBodyProps) => <View className="gap-7 px-5">{children}</View>;
