import {useState} from "react";
import {Alert, Linking, Platform, Text, View} from "react-native";
import Constants from "expo-constants";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {Bell, CircleUserRound, Download, EyeOff, FileUp, Globe, Link2, ListChecks, LogOut, ShieldCheck, Upload, Users, Vibrate} from "lucide-react-native";
import {AccountRequired} from "@/widgets/AccountRequired";
import {BackButton} from "@/widgets/BackButton";
import {PageTitle} from "@/widgets/PageTitle";
import {Screen} from "@/widgets/Screen";
import {SettingsGroup, SettingsRow} from "@/widgets/SettingsList";
import {BusyOverlay} from "@/widgets/BusyOverlay";
import {ConfirmSheet} from "@/widgets/ConfirmSheet";
import {LanguageSheet} from "@/pages/SettingsPage/widgets/LanguageSheet";
import {useSession} from "@/hooks/auth/useSession";
import {useSignOut} from "@/hooks/auth/useSignOut";
import {useRemindersEnabled, useSetRemindersEnabled} from "@/hooks/reminders";
import {useBackupActions} from "@/hooks/useBackupActions";
import {useGetProfile, useSaveProfile} from "@/hooks/profile";
import {useApplySharing} from "@/hooks/social";
import {useLanguage} from "@/hooks/useLanguage";
import {hasSupabase} from "@/lib/env";
import {haptics} from "@/lib/haptics";
import {isNotificationsSupported} from "@/lib/notifications";
import {usePreference} from "@/lib/preferences";
import {REMINDER_HOUR} from "@/helpers/reminders";
import {LANGUAGE_LABELS} from "@/i18n/resources";
import {ROUTES} from "@/constants/routes";

/** Vibration is a phone feature; the web has no use for that row. */
const isNative = Platform.OS !== "web";

/** Grouped like the system settings app: account, app behaviour, your data, and about with the required credits. */
export const SettingsPage = () => {
    const {t} = useTranslation("settings");
    const {session, isLoading} = useSession();
    const {signOut, isSigningOut} = useSignOut();
    const {language} = useLanguage();
    const {runExport, pickImport, confirmImport, cancelImport, pending, isExporting, isImporting} = useBackupActions();
    const {data: profile} = useGetProfile();
    const {mutateAsync: saveProfile} = useSaveProfile();
    const {mutate: applySharing, isPending: isApplyingSharing} = useApplySharing();

    // The profile (and so the setting) syncs on its own; publishing or taking down the activity follows it.
    const toggleSharing = async (share: boolean) => {
        if (!profile) return;
        haptics.tap();
        await saveProfile({...profile, shareActivity: share});
        applySharing(share);
    };
    const {data: isRemindersOn = false} = useRemindersEnabled();
    const {mutate: setReminders, isPending: isSettingReminders} = useSetRemindersEnabled();
    const [isHapticsOn, setHaptics] = usePreference("haptics");
    const [isHidingSpoilers, setHidingSpoilers] = usePreference("hideSpoilers");
    const [earlierPolicy, setEarlierPolicy] = usePreference("earlierEpisodes");
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

            {isSignedIn && (
                <SettingsGroup title={t("groups.friends")} footer={t("sharing.hint")} index={2}>
                    <SettingsRow
                        icon={Users}
                        tint="green"
                        label={t("sharing.label")}
                        isLoading={isApplyingSharing}
                        toggle={{value: profile?.shareActivity ?? true, onChange: (value) => void toggleSharing(value), isDisabled: isApplyingSharing}}
                    />
                </SettingsGroup>
            )}

            <SettingsGroup footer={`${t("app.hideSpoilersHint")} ${t("app.earlierEpisodesHint")}`} index={2}>
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
                <SettingsRow
                    icon={ListChecks}
                    tint="blue"
                    label={t("app.earlierEpisodes")}
                    toggle={{
                        value: earlierPolicy === "ask",
                        onChange: (value) => {
                            haptics.tap();
                            setEarlierPolicy(value ? "ask" : "skip");
                        },
                    }}
                />
            </SettingsGroup>

            <SettingsGroup title={t("groups.data")} footer={isSignedIn ? t("data.hint") : undefined} index={3}>
                <SettingsRow icon={FileUp} tint="green" label={t("letterboxd.row")} onPress={() => router.push(ROUTES.IMPORT_LETTERBOXD)}/>
                {isSignedIn && <SettingsRow icon={Link2} tint="red" label={t("trakt.row")} onPress={() => router.push(ROUTES.IMPORT_TRAKT)}/>}
                {isSignedIn && <SettingsRow icon={Upload} tint="orange" label={t("data.export")} isLoading={isExporting} onPress={() => void runExport()}/>}
                {isSignedIn && <SettingsRow icon={Download} tint="blue" label={t("data.import")} isLoading={isImporting} onPress={() => void pickImport()}/>}
            </SettingsGroup>

            <SettingsGroup title={t("groups.about")} index={4}>
                <SettingsRow icon={ShieldCheck} tint="gray" label={t("about.privacy")} onPress={() => router.push(ROUTES.PRIVACY)}/>
            </SettingsGroup>

            {isSignedIn && (
                <SettingsGroup index={5}>
                    <SettingsRow icon={LogOut} tint="red" label={t("account.signOut")} isDanger isLoading={isSigningOut} onPress={() => void signOut()}/>
                </SettingsGroup>
            )}

            <View className="items-center gap-1.5 px-4">
                <Text className="font-sans-medium text-[13px] text-muted-foreground">Reelbook {Constants.expoConfig?.version}</Text>
                <Text className="text-center font-sans text-[11px] leading-4 text-subtle-foreground">{t("about.tmdb")}</Text>
                <Text className="text-center font-sans text-[11px] leading-4 text-subtle-foreground">{t("about.justwatch")}</Text>
            </View>

            <LanguageSheet isOpen={isLanguageOpen} onClose={() => setIsLanguageOpen(false)}/>
            <ConfirmSheet
                isOpen={pending !== null}
                onClose={cancelImport}
                title={t("data.restoreTitle")}
                description={
                    pending
                        ? t(pending.lists ? "data.restoreWithLists" : "data.restoreLibraryOnly", {
                              date: pending.exportedAt ? new Date(pending.exportedAt).toLocaleDateString(language.toLowerCase()) : "—",
                              titles: Object.keys(pending.library.items).length,
                              lists: pending.lists ? Object.keys(pending.lists.lists).length : 0,
                          })
                        : ""
                }
                confirmLabel={t("data.restoreConfirm")}
                cancelLabel={t("common.cancel")}
                onConfirm={() => void confirmImport()}
                isBusy={isImporting}
            />
            <BusyOverlay isVisible={isSigningOut} label={t("account.signingOut")}/>
        </Screen>
    );
};
