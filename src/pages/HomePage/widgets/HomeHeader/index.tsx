import {Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {Reveal} from "@/components/motion/Reveal";
import {greetingKey} from "@/helpers/greeting";

/** Greeting plus the two-tone serif question that opens the home page; the lines arrive one after another. */
export const HomeHeader = () => {
    const {t} = useTranslation("home");

    return (
        <View className="gap-1.5">
            <Reveal variant="fade">
                <Text className="font-sans text-sm text-muted-foreground">{t(`greeting.${greetingKey(new Date().getHours())}`)}</Text>
            </Reveal>
            <View role="heading" aria-level={1}>
                <Reveal variant="rise" index={1}>
                    <Text className="font-serif text-[38px] leading-[38px] text-foreground">{t("title")}</Text>
                </Reveal>
                <Reveal variant="rise" index={3}>
                    <Text className="font-serif-italic text-[38px] leading-[38px] text-brand">{t("titleAccent")}</Text>
                </Reveal>
            </View>
        </View>
    );
};
