import {useState} from "react";
import {Text} from "react-native";
import {router} from "expo-router";
import {Controller, useForm} from "react-hook-form";
import {useTranslation} from "react-i18next";
import {PressScale} from "@/components/motion/PressScale";
import {Reveal} from "@/components/motion/Reveal";
import {Button} from "@/components/ui/button";
import {FormInput} from "@/components/form/FormInput";
import {AuthLayout} from "@/widgets/AuthLayout";
import {isUsernameAvailable} from "@/api/auth.api";
import {useSession} from "@/hooks/auth/useSession";
import {useGetProfile, useSaveProfile} from "@/hooks/profile";
import {isValidUsername, normalizeUsername, suggestUsername} from "@/helpers/username";
import {ROUTES} from "@/constants/routes";

type UsernameValues = {username: string};

/**
 * Shown once after signing in with an account that has no @handle yet, such as one made with Google.
 * A handle is suggested from the name or email; it can be changed later in "Edit profile", and skipped now.
 */
export const ChooseUsernamePage = () => {
    const {t} = useTranslation("auth");
    const {session} = useSession();
    const {data: profile} = useGetProfile();
    const {mutateAsync: saveProfile} = useSaveProfile();
    const [formError, setFormError] = useState<string | null>(null);

    const metadata: Record<string, unknown> = session?.user.user_metadata ?? {};
    const googleName = typeof metadata.full_name === "string" ? metadata.full_name : typeof metadata.name === "string" ? metadata.name : null;
    const suggestion = suggestUsername(profile?.name || googleName, session?.user.email);

    // `values` follows the suggestion once the session has loaded, until the field is edited.
    const {control, handleSubmit, setError, formState: {errors, isSubmitting}} = useForm<UsernameValues>({
        mode: "onTouched",
        values: {username: suggestion},
        resetOptions: {keepDirtyValues: true},
    });

    const submit = handleSubmit(async ({username}) => {
        setFormError(null);
        const handle = normalizeUsername(username);
        const isFree = await isUsernameAvailable(handle).catch(() => null);
        if (isFree === null) {
            setFormError(t("errors.generic"));
            return;
        }
        if (!isFree) {
            setError("username", {message: t("errors.username_taken")});
            return;
        }
        if (!profile) return;
        try {
            await saveProfile({...profile, username: handle});
            router.replace(ROUTES.HOME);
        } catch {
            setFormError(t("errors.generic"));
        }
    });

    return (
        <AuthLayout title={t("chooseUsername.title")} subtitle={t("chooseUsername.subtitle")}>
            <Controller
                control={control}
                name="username"
                rules={{validate: (value) => isValidUsername(value) || t("errors.invalidUsername")}}
                render={({field: {value, onChange, onBlur}}) => (
                    <FormInput
                        label={t("fields.username")}
                        placeholder="isa"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.username?.message}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="username"
                    />
                )}
            />
            <Text className="-mt-2 font-sans text-xs leading-[18px] text-muted-foreground">{t("chooseUsername.hint")}</Text>
            {formError && <Reveal key={formError} variant="fade"><Text className="font-sans text-sm text-danger">{formError}</Text></Reveal>}
            <Button variant="brand" label={t("chooseUsername.submit")} isLoading={isSubmitting} onPress={() => void submit()}/>
            <PressScale dimTo={0.5} scaleTo={0.97} onPress={() => router.replace(ROUTES.HOME)} className="items-center py-2" hitSlop={8}>
                <Text className="font-sans-medium text-sm text-muted-foreground">{t("chooseUsername.later")}</Text>
            </PressScale>
        </AuthLayout>
    );
};
