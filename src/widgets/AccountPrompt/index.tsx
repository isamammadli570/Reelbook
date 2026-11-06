import {useEffect, useState} from "react";
import {Text, View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {PressScale} from "@/components/motion/PressScale";
import {Button} from "@/components/ui/button";
import {BottomSheet} from "@/widgets/BottomSheet";
import {subscribeAccountPrompt} from "@/lib/accountGate";
import {ROUTES} from "@/constants/routes";

/** The sign-in sheet shown when a guest tries to save something. It sits at the root, so it can appear over any page. */
export const AccountPrompt = () => {
    const {t} = useTranslation("auth");
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => subscribeAccountPrompt(() => setIsOpen(true)), []);

    const openRoute = (route: string) => {
        setIsOpen(false);
        router.push(route);
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title={t("prompt.title")}>
            <Text className="-mt-2 font-sans text-sm leading-5 text-muted-foreground">{t("prompt.description")}</Text>
            <View className="gap-2">
                <Button variant="brand" label={t("signUp.submit")} onPress={() => openRoute(ROUTES.SIGN_UP)}/>
                <Button variant="outline" label={t("signIn.submit")} onPress={() => openRoute(ROUTES.SIGN_IN)}/>
                <PressScale dimTo={0.5} scaleTo={0.97} onPress={() => setIsOpen(false)} className="items-center py-2" hitSlop={8}>
                    <Text className="font-sans-medium text-sm text-muted-foreground">{t("prompt.later")}</Text>
                </PressScale>
            </View>
        </BottomSheet>
    );
};
