import {useState} from "react";
import {Pressable, Text, View} from "react-native";
import {router} from "expo-router";
import {Controller, useForm} from "react-hook-form";
import {useTranslation} from "react-i18next";
import {Button} from "@/components/ui/button";
import {FormInput} from "@/components/form/FormInput";
import {AuthLayout} from "@/widgets/AuthLayout";
import {EmptyState} from "@/widgets/EmptyState";
import {signUp} from "@/api/auth.api";
import {getProfile, saveProfile} from "@/api/profile.api";
import {isValidUsername, normalizeUsername} from "@/helpers/username";
import {ROUTES} from "@/constants/routes";
import {EMAIL_PATTERN, PASSWORD_MIN_LENGTH} from "@/constants/validation";

type SignUpValues = {username: string; email: string; password: string};

/** Username, email and password. With email confirmation off the user lands on the home page signed in. */
export const SignUpPage = () => {
    const {t} = useTranslation("auth");
    const [formError, setFormError] = useState<string | null>(null);
    const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);
    const {control, handleSubmit, setError, formState: {errors, isSubmitting}} = useForm<SignUpValues>({
        mode: "onTouched",
        defaultValues: {username: "", email: "", password: ""},
    });

    const submit = handleSubmit(async ({username, email, password}) => {
        setFormError(null);
        const handle = normalizeUsername(username);
        const result = await signUp(email.trim(), password, handle);

        if (result.error === "username_taken") {
            setError("username", {message: t("errors.username_taken")});
            return;
        }
        if (result.error) {
            setFormError(t(`errors.${result.error}`));
            return;
        }

        // The handle shows on the profile straight away; sync uploads it with the rest of the profile.
        await saveProfile({...(await getProfile()), username: handle});
        if (result.needsConfirmation) setIsAwaitingConfirmation(true);
        else router.replace(ROUTES.HOME);
    });

    const footer = (
        <View className="flex-row flex-wrap justify-center gap-1">
            <Text className="font-sans text-sm text-muted-foreground">{t("signUp.haveAccount")}</Text>
            <Pressable onPress={() => router.replace(ROUTES.SIGN_IN)} hitSlop={8}>
                <Text className="font-sans-semibold text-sm text-brand">{t("signUp.toSignIn")}</Text>
            </Pressable>
        </View>
    );

    if (isAwaitingConfirmation) {
        return (
            <AuthLayout title={t("confirm.title")} subtitle={t("confirm.subtitle")}>
                <EmptyState
                    title={t("confirm.cardTitle")}
                    description={t("confirm.cardDescription")}
                    action={<Button variant="primary" label={t("signUp.toSignIn")} onPress={() => router.replace(ROUTES.SIGN_IN)}/>}
                />
            </AuthLayout>
        );
    }

    return (
        <AuthLayout title={t("signUp.title")} subtitle={t("signUp.subtitle")} footer={footer}>
            <Controller
                control={control}
                name="username"
                rules={{validate: (value) => isValidUsername(value) || t("errors.invalidUsername")}}
                render={({field: {value, onChange, onBlur}}) => (
                    <FormInput label={t("fields.username")} placeholder="isa" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.username?.message} autoCapitalize="none" autoCorrect={false} autoComplete="username"/>
                )}
            />
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
                rules={{minLength: {value: PASSWORD_MIN_LENGTH, message: t("errors.shortPassword")}, required: t("errors.shortPassword")}}
                render={({field: {value, onChange, onBlur}}) => (
                    <FormInput label={t("fields.password")} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.password?.message} secureTextEntry autoCapitalize="none" autoComplete="new-password"/>
                )}
            />
            {formError && <Text className="font-sans text-sm text-danger">{formError}</Text>}
            <Button variant="brand" label={t("signUp.submit")} disabled={isSubmitting} onPress={() => void submit()}/>
            <Text className="text-center font-sans text-xs leading-[18px] text-subtle-foreground">{t("signUp.hint")}</Text>
        </AuthLayout>
    );
};
