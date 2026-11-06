import {useState} from "react";
import {ActivityIndicator, Text, View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import Svg, {Path} from "react-native-svg";
import {PressScale} from "@/components/motion/PressScale";
import {signInWithGoogle} from "@/api/auth.api";
import {ROUTES} from "@/constants/routes";

/** Google's own "G", in its four colours, as its sign-in guidelines ask. */
const GoogleMark = () => (
    <Svg width={18} height={18} viewBox="0 0 48 48">
        <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </Svg>
);

type GoogleButtonProps = {
    /** Shown above the form when Google sign-in fails; already a translated sentence. */
    onError: (message: string | null) => void;
};

/**
 * "Continue with Google", for signing in and signing up alike: a Google account with no Reelbook account yet
 * gets one. Drawn as Google's dark button (dark fill, grey outline), which suits the app's dark theme.
 */
export const GoogleButton = ({onError}: GoogleButtonProps) => {
    const {t} = useTranslation("auth");
    const [isBusy, setIsBusy] = useState(false);

    const start = async () => {
        onError(null);
        setIsBusy(true);
        try {
            const result = await signInWithGoogle();
            // On the web the browser is leaving for Google: stay put, still busy, until the page changes.
            if (result.isRedirecting) return;
            if (result.error) onError(t(`errors.${result.error}`));
            // In the app the session is set by now.
            else if (!result.cancelled) router.replace(ROUTES.HOME);
            setIsBusy(false);
        } catch {
            onError(t("errors.generic"));
            setIsBusy(false);
        }
    };

    return (
        <PressScale
            onPress={() => void start()}
            disabled={isBusy}
            role="button"
            aria-label={t("google.continue")}
            scaleTo={0.97}
            className="h-12 flex-row items-center justify-center gap-3 rounded-full border border-[#8E918F] bg-[#131314]"
        >
            {isBusy ? <ActivityIndicator size="small" color="#E3E3E3"/> : <GoogleMark/>}
            <Text className="font-sans-medium text-[15px] text-[#E3E3E3]">{t("google.continue")}</Text>
        </PressScale>
    );
};

/** A thin line with "or" in the middle, between the Google button and the email form. */
export const OrDivider = () => {
    const {t} = useTranslation("auth");
    return (
        <View className="flex-row items-center gap-3">
            <View className="h-px flex-1 bg-border"/>
            <Text className="font-sans text-xs text-muted-foreground">{t("google.or")}</Text>
            <View className="h-px flex-1 bg-border"/>
        </View>
    );
};
