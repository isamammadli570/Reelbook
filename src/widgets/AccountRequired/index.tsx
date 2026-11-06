import {Text, View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {Reveal} from "@/components/motion/Reveal";
import {Button} from "@/components/ui/button";
import {ROUTES} from "@/constants/routes";

type AccountRequiredProps = {
    description: string;
};

/** Shown in place of a page that holds personal data, for a guest who has not signed in. */
export const AccountRequired = ({description}: AccountRequiredProps) => {
    const {t} = useTranslation("auth");

    return (
        <Reveal variant="fade" className="gap-4 rounded-2xl border border-border bg-surface p-5">
            <View className="gap-1.5">
                <Text className="font-serif text-2xl text-foreground">{t("guest.title")}</Text>
                <Text className="font-sans text-sm leading-5 text-muted-foreground">{description}</Text>
            </View>
            <View className="gap-2">
                <Button variant="brand" label={t("signUp.submit")} onPress={() => router.push(ROUTES.SIGN_UP)}/>
                <Button variant="outline" label={t("signIn.submit")} onPress={() => router.push(ROUTES.SIGN_IN)}/>
            </View>
        </Reveal>
    );
};
