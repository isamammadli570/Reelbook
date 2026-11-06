import {useState} from "react";
import {Pressable, Text, View} from "react-native";
import {router} from "expo-router";
import {Controller, useForm} from "react-hook-form";
import {useTranslation} from "react-i18next";
import {Button} from "@/components/ui/button";
import {FormInput} from "@/components/form/FormInput";
import {AuthLayout} from "@/widgets/AuthLayout";
import {requestPasswordReset, resetPassword} from "@/api/auth.api";
import {haptics} from "@/lib/haptics";
import {ROUTES} from "@/constants/routes";
import {EMAIL_PATTERN, OTP_PATTERN, PASSWORD_MIN_LENGTH} from "@/constants/validation";

type EmailValues = {email: string};
type ResetValues = {code: string; password: string};

/**
 * Two steps on one screen: ask for the email, then take the emailed code with the new password.
 * A correct code signs the user in, so they land on the home page like after signing in.
 */
export const ForgotPasswordPage = () => {
    const {t} = useTranslation("auth");
    const [email, setEmail] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const emailForm = useForm<EmailValues>({mode: "onTouched", defaultValues: {email: ""}});
    const resetForm = useForm<ResetValues>({mode: "onTouched", defaultValues: {code: "", password: ""}});

    const sendCode = async (address: string): Promise<boolean> => {
        setFormError(null);
        const result = await requestPasswordReset(address);
        if (result.error) {
            setFormError(t(`errors.${result.error}`));
            return false;
        }
        return true;
    };

    const submitEmail = emailForm.handleSubmit(async (values) => {
        const address = values.email.trim();
        if (await sendCode(address)) setEmail(address);
    });

    const submitReset = resetForm.handleSubmit(async ({code, password}) => {
        if (!email) return;
        setFormError(null);
        const result = await resetPassword(email, code.trim(), password);
        if (result.error) {
            setFormError(t(`errors.${result.error}`));
            return;
        }
        haptics.success();
        router.replace(ROUTES.HOME);
    });

    const backToSignIn = (
        <Pressable onPress={() => router.replace(ROUTES.SIGN_IN)} className="items-center py-2" hitSlop={8}>
            <Text className="font-sans-semibold text-sm text-brand">{t("forgot.backToSignIn")}</Text>
        </Pressable>
    );

    if (!email) {
        return (
            <AuthLayout title={t("forgot.title")} subtitle={t("forgot.subtitle")} footer={backToSignIn}>
                <Controller
                    control={emailForm.control}
                    name="email"
                    rules={{required: t("errors.invalidEmail"), pattern: {value: EMAIL_PATTERN, message: t("errors.invalidEmail")}}}
                    render={({field: {value, onChange, onBlur}}) => (
                        <FormInput
                            label={t("fields.email")}
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
                {formError && <Text className="font-sans text-sm text-danger">{formError}</Text>}
                <Button variant="brand" label={t("forgot.sendCode")} disabled={emailForm.formState.isSubmitting} onPress={() => void submitEmail()}/>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout title={t("forgot.codeTitle")} subtitle={t("forgot.codeSubtitle", {email})} footer={backToSignIn}>
            <Controller
                control={resetForm.control}
                name="code"
                rules={{required: t("errors.invalidCode"), pattern: {value: OTP_PATTERN, message: t("errors.invalidCode")}}}
                render={({field: {value, onChange, onBlur}}) => (
                    <FormInput
                        label={t("fields.code")}
                        placeholder="123456"
                        value={value}
                        onChangeText={(text) => onChange(text.replace(/\D/g, ""))}
                        onBlur={onBlur}
                        error={resetForm.formState.errors.code?.message}
                        keyboardType="number-pad"
                        autoComplete="one-time-code"
                        textContentType="oneTimeCode"
                        maxLength={10}
                    />
                )}
            />
            <Controller
                control={resetForm.control}
                name="password"
                rules={{required: t("errors.shortPassword"), minLength: {value: PASSWORD_MIN_LENGTH, message: t("errors.shortPassword")}}}
                render={({field: {value, onChange, onBlur}}) => (
                    <FormInput
                        label={t("fields.newPassword")}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={resetForm.formState.errors.password?.message}
                        secureTextEntry
                        autoCapitalize="none"
                        autoComplete="new-password"
                    />
                )}
            />
            {formError && <Text className="font-sans text-sm text-danger">{formError}</Text>}
            {notice && <Text className="font-sans text-sm text-muted-foreground">{notice}</Text>}
            <Button variant="brand" label={t("forgot.submit")} disabled={resetForm.formState.isSubmitting} onPress={() => void submitReset()}/>
            <View className="flex-row flex-wrap justify-center gap-1">
                <Pressable
                    hitSlop={8}
                    onPress={() => {
                        setNotice(null);
                        void sendCode(email).then((isSent) => isSent && setNotice(t("forgot.resent")));
                    }}
                >
                    <Text className="font-sans-medium text-sm text-foreground">{t("forgot.resend")}</Text>
                </Pressable>
                <Text className="font-sans text-sm text-muted-foreground">·</Text>
                <Pressable
                    hitSlop={8}
                    onPress={() => {
                        setEmail(null);
                        setFormError(null);
                        setNotice(null);
                        resetForm.reset();
                    }}
                >
                    <Text className="font-sans-medium text-sm text-foreground">{t("forgot.changeEmail")}</Text>
                </Pressable>
            </View>
        </AuthLayout>
    );
};
