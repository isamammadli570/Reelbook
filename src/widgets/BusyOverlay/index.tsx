import {ActivityIndicator, Modal, Text, View} from "react-native";
import {useCSSVariable} from "uniwind";

type BusyOverlayProps = {isVisible: boolean; label: string};

/**
 * Covers the screen while something that leaves the screen is under way, such as signing out: the menu that
 * started it has closed, so without this nothing would show that the tap was taken.
 */
export const BusyOverlay = ({isVisible, label}: BusyOverlayProps) => {
    const foreground = String(useCSSVariable("--color-foreground"));
    return (
        <Modal visible={isVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => undefined}>
            <View className="flex-1 items-center justify-center bg-black/60" aria-busy aria-live="polite">
                <View className="items-center gap-3 rounded-2xl bg-surface-raised px-8 py-6">
                    <ActivityIndicator size="large" color={foreground}/>
                    <Text className="font-sans-medium text-[15px] text-foreground">{label}</Text>
                </View>
            </View>
        </Modal>
    );
};
