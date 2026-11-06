import {useState} from "react";
import {Alert, Linking, Platform, Text, View} from "react-native";
import Constants from "expo-constants";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {Bell, CircleUserRound, Download, EyeOff, Globe, LogOut, ShieldCheck, Upload, Vibrate} from "lucide-react-native";
import {AccountRequired} from "@/widgets/AccountRequired";
import {BackButton} from "@/widgets/BackButton";
import {PageTitle} from "@/widgets/PageTitle";
import {Screen} from "@/widgets/Screen";
import {SettingsGroup, SettingsRow} from "@/widgets/SettingsList";
import {LanguageSheet} from "@/pages/SettingsPage/widgets/LanguageSheet";
import {useSession} from "@/hooks/auth/useSession";
import {useSignOut} from "@/hooks/auth/useSignOut";
import {useRemindersEnabled, useSetRemindersEnabled} from "@/hooks/reminders";
import {useBackupActions} from "@/hooks/useBackupActions";
import {useLanguage} from "@/hooks/useLanguage";
import {hasSupabase} from "@/lib/env";
import {haptics} from "@/lib/haptics";
import {isNotificationsSupported} from "@/lib/notifications";
import {usePreference} from "@/lib/preferences";
import {REMINDER_HOUR} from "@/helpers/reminders";
import {LANGUAGE_LABELS} from "@/i18n/resources";
import {ROUTES} from "@/constants/routes";

/** Vibration, sharing a file and picking one are phone features; the web has no use for those rows. */
const isNative = Platform.OS !== "web";

/** Grouped like the system settings app: account, app behaviour, your data, and about with the required credits. */
export const SettingsPage = () => {
    const {t} = useTranslation("settings");
    const {session, isLoading} = useSession();
    const {signOut, isSigningOut} = useSignOut();
    const {language} = useLanguage();
    const {runExport, runImport} = useBackupActions();
    const {data: isRemindersOn = false} = useRemindersEnabled();
    const {mutate: setReminders, isPending: isSettingReminders} = useSetRemindersEnabled();
    const [isHapticsOn, setHaptics] = usePreference("haptics");
    const [isHidingSpoilers, setHidingSpoilers] = usePreference("hideSpoilers");
    const [isLanguageOpen, setIsLanguageOpen] = useState(false);
    const isSignedIn = Boolean(session);

    const toggleReminders = (value: boolean) => {
        haptics.tap();
        setReminders(value, {
            onSuccess: ({granted}) => {
                if (granted) return;
                Alert.alert(t("reminders.title"), t("reminders.denied"), [
                    {text: t("common.cancel"), style: "cancel"},
                    {text: t("reminders.openSettings"), onPress: () => void Linking.openSettings()},
                ]);
            },
        });
    };

    return (
        <Screen>
            <BackButton className="self-start"/>
            <PageTitle title={t("title")}/>

            {hasSupabase && !isLoading && !isSignedIn && <AccountRequired description={t("account.guestDescription")}/>}

            {isSignedIn && (
                <SettingsGroup title={t("groups.you")} index={0}>
                    <SettingsRow icon={CircleUserRound} tint="blue" label={t("account.title")} value={session?.user.email} onPress={() => router.push(ROUTES.ACCOUNT)}/>
                </SettingsGroup>
            )}

            <SettingsGroup title={t("groups.app")} index={1}>
                <SettingsRow icon={Globe} tint="indigo" label={t("app.language")} value={LANGUAGE_LABELS[language]} onPress={() => setIsLanguageOpen(true)}/>
                {isNotificationsSupported && (
                    <SettingsRow
                        icon={Bell}
                        tint="red"
                        label={t("reminders.label")}
                        toggle={{value: isRemindersOn, onChange: toggleReminders, isDisabled: isSettingReminders}}
                    />
                )}
                {isNative && (
                    <SettingsRow
                        icon={Vibrate}
                        tint="pink"
                        label={t("app.haptics")}
                        toggle={{
                            value: isHapticsOn,
                            onChange: (value) => {
                                setHaptics(value);
                                haptics.tap();
                            },
                        }}
                    />
                )}
            </SettingsGroup>
            {isNotificationsSupported
                ? <Text className="-mt-4 px-1 font-sans text-xs leading-[18px] text-muted-foreground">{t("reminders.description", {hour: `${REMINDER_HOUR}:00`})}</Text>
                : <Text className="-mt-4 px-1 font-sans text-xs leading-[18px] text-muted-foreground">{t("reminders.webOnly")}</Text>}

            <SettingsGroup footer={t("app.hideSpoilersHint")} index={2}>
                <SettingsRow
                    icon={EyeOff}
                    tint="purple"
                    label={t("app.hideSpoilers")}
                    toggle={{
                        value: isHidingSpoilers,
                        onChange: (value) => {
                            haptics.tap();
                            setHidingSpoilers(value);
                        },
                    }}
                />
            </SettingsGroup>

            {isSignedIn && isNative && (
                <SettingsGroup title={t("groups.data")} footer={t("data.hint")} index={3}>
                    <SettingsRow icon={Upload} tint="orange" label={t("data.export")} onPress={() => void runExport()}/>
                    <SettingsRow icon={Download} tint="green" label={t("data.import")} onPress={() => void runImport()}/>
                </SettingsGroup>
            )}

            <SettingsGroup title={t("groups.about")} index={4}>
                <SettingsRow icon={ShieldCheck} tint="gray" label={t("about.privacy")} onPress={() => router.push(ROUTES.PRIVACY)}/>
            </SettingsGroup>

            {isSignedIn && (
                <SettingsGroup index={5}>
                    <SettingsRow icon={LogOut} tint="red" label={t("account.signOut")} isDanger onPress={isSigningOut ? undefined : () => void signOut()}/>
                </SettingsGroup>
            )}

            <View className="items-center gap-1.5 px-4">
                <Text className="font-sans-medium text-[13px] text-muted-foreground">Reelbook {Constants.expoConfig?.version}</Text>
                <Text className="text-center font-sans text-[11px] leading-4 text-subtle-foreground">{t("about.tmdb")}</Text>
                <Text className="text-center font-sans text-[11px] leading-4 text-subtle-foreground">{t("about.justwatch")}</Text>
            </View>

            <LanguageSheet isOpen={isLanguageOpen} onClose={() => setIsLanguageOpen(false)}/>
        </Screen>
    );
};
