import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {storage} from "@/lib/storage";
import {cancelAllReminders, isNotificationsSupported, requestNotificationPermission} from "@/lib/notifications";
import {QUERY_KEYS, STORAGE_KEYS} from "@/constants/other";

/** Whether new-episode reminders are on; off until the user turns them on and grants permission. */
export const useRemindersEnabled = () =>
    useQuery({
        queryKey: [QUERY_KEYS.EPISODE_REMINDERS],
        queryFn: async () => isNotificationsSupported && (await storage.get<boolean>(STORAGE_KEYS.EPISODE_REMINDERS)) === true,
    });

/** Turning on asks for permission first and stays off when it is refused; `granted` tells the screen which happened. */
export const useSetRemindersEnabled = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (isEnabled: boolean): Promise<{isEnabled: boolean; granted: boolean}> => {
            if (!isEnabled) {
                await storage.set(STORAGE_KEYS.EPISODE_REMINDERS, false);
                await cancelAllReminders();
                return {isEnabled: false, granted: true};
            }
            const granted = await requestNotificationPermission();
            await storage.set(STORAGE_KEYS.EPISODE_REMINDERS, granted);
            return {isEnabled: granted, granted};
        },
        onSuccess: ({isEnabled}) => queryClient.setQueryData([QUERY_KEYS.EPISODE_REMINDERS], isEnabled),
    });
};
