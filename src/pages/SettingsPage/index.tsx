import {Text, View} from "react-native";
import Constants from "expo-constants";
import {useTranslation} from "react-i18next";
import {LogOut} from "lucide-react-native";
import {Button} from "@/components/ui/button";
import {AccountRequired} from "@/widgets/AccountRequired";
import {BackButton} from "@/widgets/BackButton";
import {PageTitle} from "@/widgets/PageTitle";
import {Screen} from "@/widgets/Screen";
import {Section} from "@/widgets/Section";
import {BackupSection} from "@/pages/SettingsPage/widgets/BackupSection";
import {LanguagePicker} from "@/pages/SettingsPage/widgets/LanguagePicker";
import {RemindersSection} from "@/pages/SettingsPage/widgets/RemindersSection";
import {useSession} from "@/hooks/auth/useSession";
import {useSignOut} from "@/hooks/auth/useSignOut";
import {hasSupabase} from "@/lib/env";

/** Account, language, reminders, backup and the about box with TMDB's required credit. */
export const SettingsPage = () => {
    const {t} = useTranslation("settings");
    const {session, isLoading} = useSession();
    const {signOut, isSigningOut} = useSignOut();
    const isSignedIn = Boolean(session);

    return (
        <Screen>
            <BackButton className="self-start"/>
            <PageTitle title={t("title")}/>

            {hasSupabase && !isLoading && (
                isSignedIn ? (
                    <Section title={t("account.title")}>
                        <View className="gap-1 rounded-2xl bg-surface p-4">
                            <Text className="font-sans text-xs text-muted-foreground">{t("account.signedInAs")}</Text>
                            <Text className="font-sans-medium text-[15px] text-foreground">{session?.user.email}</Text>
                        </View>
                        <Button variant="outline" icon={LogOut} label={t("account.signOut")} disabled={isSigningOut} onPress={() => void signOut()}/>
                    </Section>
                ) : (
                    <AccountRequired description={t("account.guestDescription")}/>
                )
            )}

            <LanguagePicker/>
            <RemindersSection/>
            {isSignedIn && <BackupSection/>}

            <Section title={t("about.title")}>
                <View className="gap-2 rounded-2xl bg-surface p-4">
                    <Text className="font-sans-medium text-[15px] text-foreground">Reelbook {Constants.expoConfig?.version}</Text>
                    <Text className="font-sans text-xs leading-[18px] text-muted-foreground">{t("about.tmdb")}</Text>
                </View>
            </Section>
        </Screen>
    );
};
