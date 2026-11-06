import {useState} from "react";
import {Linking, Switch, Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {useCSSVariable} from "uniwind";
import {Button} from "@/components/ui/button";
import {Section} from "@/widgets/Section";
import {useRemindersEnabled, useSetRemindersEnabled} from "@/hooks/reminders";
import {isNotificationsSupported} from "@/lib/notifications";
import {REMINDER_HOUR} from "@/helpers/reminders";
import {haptics} from "@/lib/haptics";

/** The new-episode reminder switch; when the system has said no, a way to its settings instead. */
export const RemindersSection = () => {
    const {t} = useTranslation("settings");
    const {data: isEnabled = false} = useRemindersEnabled();
    const {mutate: setEnabled, isPending} = useSetRemindersEnabled();
    const [isDenied, setIsDenied] = useState(false);
    const brand = String(useCSSVariable("--color-brand"));
    const track = String(useCSSVariable("--color-border"));

    return (
        <Section title={t("reminders.title")}>
            <View className="gap-3 rounded-2xl bg-surface p-4">
                <View className="flex-row items-center gap-3">
                    <View className="min-w-0 flex-1 gap-1">
                        <Text className="font-sans-medium text-[15px] text-foreground">{t("reminders.label")}</Text>
                        <Text className="font-sans text-xs leading-[18px] text-muted-foreground">
                            {isNotificationsSupported ? t("reminders.description", {hour: `${REMINDER_HOUR}:00`}) : t("reminders.webOnly")}
                        </Text>
                    </View>
                    {isNotificationsSupported && (
                        <Switch
                            value={isEnabled}
                            disabled={isPending}
                            aria-label={t("reminders.label")}
                            trackColor={{true: brand, false: track}}
                            onValueChange={(value) => {
                                haptics.tap();
                                setEnabled(value, {onSuccess: ({granted}) => setIsDenied(!granted)});
                            }}
                        />
                    )}
                </View>
                {isDenied && (
                    <View className="gap-2">
                        <Text className="font-sans text-xs leading-[18px] text-muted-foreground">{t("reminders.denied")}</Text>
                        <Button variant="outline" label={t("reminders.openSettings")} onPress={() => void Linking.openSettings()}/>
                    </View>
                )}
            </View>
        </Section>
    );
};
