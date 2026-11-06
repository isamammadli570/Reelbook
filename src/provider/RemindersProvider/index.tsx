import {useEffect, useMemo, useRef, type ReactNode} from "react";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import * as Notifications from "expo-notifications";
import {useCalendar} from "@/hooks/calendar";
import {useRemindersEnabled} from "@/hooks/reminders";
import {configureNotifications, hasNotificationPermission, isNotificationsSupported, responseUrl, syncScheduledReminders} from "@/lib/notifications";
import {planReminders} from "@/helpers/reminders";
import {usePreference} from "@/lib/preferences";
import {buildRoute} from "@/constants/routes";

/** How far ahead reminders are scheduled; a launch every few weeks keeps them topped up. */
const REMINDER_WINDOW_DAYS = 30;

/** Keeps one local notification per upcoming episode of every followed series. */
const ReminderScheduler = () => {
    const {t} = useTranslation(["settings", "details"]);
    const today = useMemo(() => new Date(), []);
    const {episodes, isLoading} = useCalendar(today, REMINDER_WINDOW_DAYS);
    const [isHidingSpoilers] = usePreference("hideSpoilers");
    // Runs one after another, so a quick second change cannot schedule against a stale list.
    const queue = useRef<Promise<void>>(Promise.resolve());

    useEffect(() => {
        if (isLoading) return;
        queue.current = queue.current.then(async () => {
            if (!(await hasNotificationPermission())) return;
            await syncScheduledReminders(planReminders(episodes, new Date()), ({episode}) => ({
                title: episode.title,
                body: isHidingSpoilers
                    ? t("reminders.bodyNoSpoilers", {code: t("details:episodeCode", {season: episode.season, episode: episode.episode})})
                    : t("reminders.body", {code: t("details:episodeCode", {season: episode.season, episode: episode.episode}), name: episode.episodeName}),
                url: buildRoute.series(episode.seriesId),
            }));
        }).catch(() => {
            // A failed schedule is retried on the next change or launch; nothing to show the user.
        });
    }, [episodes, isLoading, isHidingSpoilers, t]);

    return null;
};

/** Opens the series a tapped reminder is about, whether the app was running or launched by the tap. */
const ReminderTaps = () => {
    const {t} = useTranslation("settings");
    const response = Notifications.useLastNotificationResponse();
    const handled = useRef<string | null>(null);

    useEffect(() => {
        void configureNotifications(t("reminders.channel"));
    }, [t]);

    useEffect(() => {
        const url = responseUrl(response);
        const id = response?.notification.request.identifier ?? null;
        if (!url || id === handled.current) return;
        handled.current = id;
        router.push(url);
    }, [response]);

    return null;
};

const NativeReminders = () => {
    const {data: isEnabled} = useRemindersEnabled();
    return (
        <>
            <ReminderTaps/>
            {isEnabled && <ReminderScheduler/>}
        </>
    );
};

export const RemindersProvider = ({children}: {children: ReactNode}) => (
    <>
        {children}
        {isNotificationsSupported && <NativeReminders/>}
    </>
);
