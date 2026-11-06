import {Platform} from "react-native";
import * as Notifications from "expo-notifications";
import {AndroidImportance, IosAuthorizationStatus} from "expo-notifications";
import {diffReminders, type PlannedReminder} from "@/helpers/reminders";

/** Browsers cannot schedule notifications for a closed tab, so reminders are a phone feature. */
export const isNotificationsSupported = Platform.OS !== "web";

const CHANNEL_ID = "episodes";

export type ReminderContent = {title: string; body: string; url: string};

/** Shows reminders as banners even while the app is open, and gives Android its channel (needed before it will ask). */
export const configureNotifications = async (channelName: string): Promise<void> => {
    if (!isNotificationsSupported) return;
    Notifications.setNotificationHandler({
        handleNotification: async () => ({shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false}),
    });
    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {name: channelName, importance: AndroidImportance.DEFAULT});
    }
};

const isGranted = (status: Notifications.NotificationPermissionsStatus): boolean =>
    status.granted || status.ios?.status === IosAuthorizationStatus.PROVISIONAL;

/** Asks only when the system still allows asking; otherwise reports the standing answer. */
export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!isNotificationsSupported) return false;
    const current = await Notifications.getPermissionsAsync();
    if (isGranted(current)) return true;
    if (!current.canAskAgain) return false;
    return isGranted(await Notifications.requestPermissionsAsync());
};

export const hasNotificationPermission = async (): Promise<boolean> =>
    isNotificationsSupported && isGranted(await Notifications.getPermissionsAsync());

/** Makes the scheduled episode reminders match the plan, touching only the ones that changed. */
export const syncScheduledReminders = async (planned: PlannedReminder[], contentFor: (reminder: PlannedReminder) => ReminderContent): Promise<void> => {
    if (!isNotificationsSupported) return;
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const {cancel, add} = diffReminders(scheduled.map((request) => request.identifier), planned);
    await Promise.all(cancel.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
    for (const reminder of add) {
        const {title, body, url} = contentFor(reminder);
        await Notifications.scheduleNotificationAsync({
            identifier: reminder.id,
            content: {title, body, data: {url}},
            trigger: {type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminder.date, channelId: CHANNEL_ID},
        });
    }
};

export const cancelAllReminders = (): Promise<void> => syncScheduledReminders([], () => ({title: "", body: "", url: ""}));

/** The app route a tapped reminder points at. */
export const responseUrl = (response: Notifications.NotificationResponse | null | undefined): string | null => {
    const url = response?.notification.request.content.data?.url;
    return typeof url === "string" ? url : null;
};
