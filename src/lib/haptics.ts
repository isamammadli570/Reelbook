import {Platform} from "react-native";
import * as Haptics from "expo-haptics";
import {getPreference} from "@/lib/preferences";

// Web would map these to the Vibration API, which buzzes phones on every tap; feedback stays native-only.
const isNative = Platform.OS !== "web";

/** Read on every call, so turning vibration off in settings applies at once. */
const isOn = (): boolean => isNative && getPreference("haptics");

export const haptics = {
    tap: () => {
        if (isOn()) void Haptics.selectionAsync().catch(() => undefined);
    },
    success: () => {
        if (isOn()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    },
};
