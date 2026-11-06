import {useEffect, useState} from "react";
import {Modal, Pressable, Text, View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {SlideInDown} from "react-native-reanimated";
import {Button} from "@/components/ui/button";
import {AnimatedView} from "@/components/ui/animated";
import {subscribeAccountPrompt} from "@/lib/accountGate";
import {ROUTES} from "@/constants/routes";
import {MAX_CONTENT_WIDTH} from "@/constants/other";

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
        <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
            <View className="flex-1 justify-end bg-black/60">
                <Pressable className="flex-1" onPress={() => setIsOpen(false)} aria-label={t("prompt.later")}/>
                <AnimatedView entering={SlideInDown.duration(320).springify().damping(20)} className="w-full self-center gap-3 rounded-t-3xl border border-border bg-surface px-5 pb-10 pt-5" style={{maxWidth: MAX_CONTENT_WIDTH}}>
                    <Text role="heading" className="font-serif text-[26px] text-foreground">{t("prompt.title")}</Text>
                    <Text className="font-sans text-sm leading-5 text-muted-foreground">{t("prompt.description")}</Text>
                    <View className="mt-2 gap-2">
                        <Button variant="brand" label={t("signUp.submit")} onPress={() => openRoute(ROUTES.SIGN_UP)}/>
                        <Button variant="outline" label={t("signIn.submit")} onPress={() => openRoute(ROUTES.SIGN_IN)}/>
                        <Pressable onPress={() => setIsOpen(false)} className="items-center py-2" hitSlop={8}>
                            <Text className="font-sans-medium text-sm text-muted-foreground">{t("prompt.later")}</Text>
                        </Pressable>
                    </View>
                </AnimatedView>
            </View>
        </Modal>
    );
};
