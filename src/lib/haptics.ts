import {Platform} from "react-native";
import * as Haptics from "expo-haptics";

// Web would map these to the Vibration API, which buzzes phones on every tap; feedback stays native-only.
const isNative = Platform.OS !== "web";

export const haptics = {
    tap: () => {
        if (isNative) void Haptics.selectionAsync().catch(() => undefined);
    },
    success: () => {
        if (isNative) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    },
};
