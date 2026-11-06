import {useState} from "react";
import {Text, View} from "react-native";
import {Controller, useForm} from "react-hook-form";
import {useTranslation} from "react-i18next";
import {Trash2} from "lucide-react-native";
import {Button} from "@/components/ui/button";
import {FormInput} from "@/components/form/FormInput";
import {AccountRequired} from "@/widgets/AccountRequired";
import {BackButton} from "@/widgets/BackButton";
import {ConfirmSheet} from "@/widgets/ConfirmSheet";
import {PageTitle} from "@/widgets/PageTitle";
import {Screen} from "@/widgets/Screen";
import {Section} from "@/widgets/Section";
import {useDeleteAccount} from "@/hooks/auth/useDeleteAccount";
import {useSession} from "@/hooks/auth/useSession";
import {changeEmail, changePassword} from "@/api/auth.api";
import {haptics} from "@/lib/haptics";
import {EMAIL_PATTERN, PASSWORD_MIN_LENGTH} from "@/constants/validation";

type EmailValues = {email: string};
type PasswordValues = {password: string; repeat: string};

/** A success or error line under a form. */
const Note = ({text, isError}: {text: string | null; isError?: boolean}) =>
    text ? <Text className={isError ? "font-sans text-sm text-danger" : "font-sans text-sm text-success"}>{text}</Text> : null;

/** Change the e-mail or password, or delete the account and everything in it. */
export const AccountPage = () => {
    const {t} = useTranslation("settings");
    const {t: tAuth} = useTranslation("auth");
    const {session, isLoading} = useSession();
    const {deleteAccount, isDeleting} = useDeleteAccount();
    const [emailNote, setEmailNote] = useState<{text: string; isError: boolean} | null>(null);
    const [passwordNote, setPasswordNote] = useState<{text: string; isError: boolean} | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const emailForm = useForm<EmailValues>({mode: "onTouched", defaultValues: {email: ""}});
    const passwordForm = useForm<PasswordValues>({mode: "onTouched", defaultValues: {password: "", repeat: ""}});

    if (!isLoading && !session) {
        return (
            <Screen>
                <BackButton className="self-start"/>
                <AccountRequired description={t("account.guestDescription")}/>
            </Screen>
        );
    }

    const submitEmail = emailForm.handleSubmit(async ({email}) => {
        setEmailNote(null);
        const address = email.trim();
        const result = await changeEmail(address);
        if (result.error) {
            setEmailNote({text: tAuth(`errors.${result.error}`), isError: true});
            return;
        }
        emailForm.reset();
        setEmailNote({text: t("accountPage.emailSent", {email: address}), isError: false});
    });

    const submitPassword = passwordForm.handleSubmit(async ({password}) => {
        setPasswordNote(null);
        const result = await changePassword(password);
        if (result.error) {
            setPasswordNote({text: tAuth(`errors.${result.error}`), isError: true});
            return;
        }
        haptics.success();
        passwordForm.reset();
        setPasswordNote({text: t("accountPage.passwordChanged"), isError: false});
    });

    return (
        <Screen>
            <BackButton className="self-start"/>
            <PageTitle title={t("account.title")}/>

            <View className="gap-1 rounded-2xl bg-surface p-4">
                <Text className="font-sans text-xs text-muted-foreground">{t("account.signedInAs")}</Text>
                <Text className="font-sans-medium text-[15px] text-foreground">{session?.user.email}</Text>
            </View>

            <Section title={t("accountPage.emailTitle")} index={0}>
                <Controller
                    control={emailForm.control}
                    name="email"
                    rules={{
                        required: tAuth("errors.invalidEmail"),
                        pattern: {value: EMAIL_PATTERN, message: tAuth("errors.invalidEmail")},
                        validate: (value) => value.trim().toLowerCase() !== session?.user.email?.toLowerCase() || t("accountPage.sameEmail"),
                    }}
                    render={({field: {value, onChange, onBlur}}) => (
                        <FormInput
                            label={t("accountPage.newEmail")}
                            placeholder="name@example.com"
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            error={emailForm.formState.errors.email?.message}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />
                    )}
                />
                <Note text={emailNote?.text ?? null} isError={emailNote?.isError}/>
                <Button variant="outline" label={t("accountPage.sendLink")} disabled={emailForm.formState.isSubmitting} onPress={() => void submitEmail()}/>
            </Section>

            <Section title={t("accountPage.passwordTitle")} index={1}>
                <Controller
                    control={passwordForm.control}
                    name="password"
                    rules={{required: tAuth("errors.shortPassword"), minLength: {value: PASSWORD_MIN_LENGTH, message: tAuth("errors.shortPassword")}}}
                    render={({field: {value, onChange, onBlur}}) => (
                        <FormInput
                            label={tAuth("fields.newPassword")}
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            error={passwordForm.formState.errors.password?.message}
                            secureTextEntry
                            autoCapitalize="none"
                            autoComplete="new-password"
                        />
                    )}
                />
                <Controller
                    control={passwordForm.control}
                    name="repeat"
                    rules={{validate: (value, values) => value === values.password || t("accountPage.passwordsDiffer")}}
                    render={({field: {value, onChange, onBlur}}) => (
                        <FormInput
                            label={t("accountPage.repeatPassword")}
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            error={passwordForm.formState.errors.repeat?.message}
                            secureTextEntry
                            autoCapitalize="none"
                            autoComplete="new-password"
                        />
                    )}
                />
                <Note text={passwordNote?.text ?? null} isError={passwordNote?.isError}/>
                <Button variant="outline" label={t("accountPage.savePassword")} disabled={passwordForm.formState.isSubmitting} onPress={() => void submitPassword()}/>
            </Section>

            <Section title={t("accountPage.deleteTitle")} index={2}>
                <Text className="font-sans text-sm leading-5 text-muted-foreground">{t("accountPage.deleteDescription")}</Text>
                <Note text={deleteError} isError/>
                <Button variant="outline" icon={Trash2} label={t("accountPage.deleteButton")} className="border-danger" onPress={() => setIsConfirmOpen(true)}/>
            </Section>

            <ConfirmSheet
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                title={t("accountPage.confirmTitle")}
                description={t("accountPage.confirmDescription")}
                confirmLabel={t("accountPage.confirmDelete")}
                cancelLabel={t("common.cancel")}
                isBusy={isDeleting}
                onConfirm={() => {
                    setDeleteError(null);
                    void deleteAccount().then((isDeleted) => {
                        if (isDeleted) return;
                        setIsConfirmOpen(false);
                        setDeleteError(t("accountPage.deleteFailed"));
                    });
                }}
            />
        </Screen>
    );
};
