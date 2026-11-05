import {Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {greetingKey} from "@/helpers/greeting";

/** Greeting plus the two-tone serif question that opens the home page. */
export const HomeHeader = () => {
    const {t} = useTranslation("home");

    return (
        <View className="gap-1.5">
            <Text className="font-sans text-sm text-muted-foreground">{t(`greeting.${greetingKey(new Date().getHours())}`)}</Text>
            <Text role="heading" aria-level={1} className="font-serif text-[38px] leading-[38px] text-foreground">
                {t("title")}
                {"\n"}
                <Text className="font-serif-italic text-brand">{t("titleAccent")}</Text>
            </Text>
        </View>
    );
};
