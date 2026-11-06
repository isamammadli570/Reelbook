import {useState} from "react";
import {Text, View} from "react-native";
import {router} from "expo-router";
import {Controller, useForm} from "react-hook-form";
import {useTranslation} from "react-i18next";
import {PressScale} from "@/components/motion/PressScale";
import {Reveal} from "@/components/motion/Reveal";
import {Button} from "@/components/ui/button";
import {FormInput} from "@/components/form/FormInput";
import {AuthLayout} from "@/widgets/AuthLayout";
import {GoogleButton, OrDivider} from "@/widgets/GoogleButton";
import {signIn} from "@/api/auth.api";
import {ROUTES} from "@/constants/routes";
import {EMAIL_PATTERN} from "@/constants/validation";

type SignInValues = {email: string; password: string};

/** Email and password sign-in; on success the user lands on the home page. */
export const SignInPage = () => {
    const {t} = useTranslation("auth");
    const [formError, setFormError] = useState<string | null>(null);
    const {control, handleSubmit, formState: {errors, isSubmitting}} = useForm<SignInValues>({mode: "onTouched", defaultValues: {email: "", password: ""}});

    const submit = handleSubmit(async ({email, password}) => {
        setFormError(null);
        const result = await signIn(email.trim(), password);
        if (result.error) setFormError(t(`errors.${result.error}`));
        else router.replace(ROUTES.HOME);
    });

    return (
        <AuthLayout
            title={t("signIn.title")}
            subtitle={t("signIn.subtitle")}
            footer={(
                <View className="flex-row flex-wrap justify-center gap-1">
                    <Text className="font-sans text-sm text-muted-foreground">{t("signIn.noAccount")}</Text>
                    <PressScale dimTo={0.5} scaleTo={0.97} onPress={() => router.replace(ROUTES.SIGN_UP)} hitSlop={8}>
                        <Text className="font-sans-semibold text-sm text-brand">{t("signIn.toSignUp")}</Text>
                    </PressScale>
                </View>
            )}
        >
            <GoogleButton onError={setFormError}/>
            <OrDivider/>
            <Controller
                control={control}
                name="email"
                rules={{required: t("errors.invalidEmail"), pattern: {value: EMAIL_PATTERN, message: t("errors.invalidEmail")}}}
                render={({field: {value, onChange, onBlur}}) => (
                    <FormInput label={t("fields.email")} placeholder="name@example.com" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.email?.message} keyboardType="email-address" autoCapitalize="none" autoComplete="email"/>
                )}
            />
            <Controller
                control={control}
                name="password"
                rules={{required: t("errors.shortPassword")}}
                render={({field: {value, onChange, onBlur}}) => (
                    <FormInput label={t("fields.password")} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.password?.message} secureTextEntry autoCapitalize="none" autoComplete="password"/>
                )}
            />
            <PressScale dimTo={0.5} scaleTo={0.97} onPress={() => router.push(ROUTES.FORGOT_PASSWORD)} className="-mt-1 self-end" hitSlop={8}>
                <Text className="font-sans-medium text-[13px] text-muted-foreground">{t("signIn.forgotPassword")}</Text>
            </PressScale>
            {formError && <Reveal key={formError} variant="fade"><Text className="font-sans text-sm text-danger">{formError}</Text></Reveal>}
            <Button variant="brand" label={t("signIn.submit")} isLoading={isSubmitting} onPress={() => void submit()}/>
            <PressScale dimTo={0.5} scaleTo={0.97} onPress={() => router.replace(ROUTES.HOME)} className="items-center py-2" hitSlop={8}>
                <Text className="font-sans-medium text-sm text-muted-foreground">{t("continueAsGuest")}</Text>
            </PressScale>
        </AuthLayout>
    );
};
