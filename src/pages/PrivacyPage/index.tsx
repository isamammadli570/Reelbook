import {Linking, Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {PressScale} from "@/components/motion/PressScale";
import {BackButton} from "@/widgets/BackButton";
import {PageTitle} from "@/widgets/PageTitle";
import {Screen} from "@/widgets/Screen";
import {Section} from "@/widgets/Section";
import {CONTACT_EMAIL} from "@/constants/other";

type PolicySection = {title: string; body: string};

const asSections = (value: unknown): PolicySection[] =>
    Array.isArray(value) ? value.filter((entry): entry is PolicySection => typeof entry?.title === "string" && typeof entry?.body === "string") : [];

/** The privacy policy the app stores ask every app with accounts to link from inside it. */
export const PrivacyPage = () => {
    const {t} = useTranslation("settings");
    const sections = asSections(t("privacy.sections", {returnObjects: true}));

    return (
        <Screen>
            <BackButton className="self-start"/>
            <PageTitle title={t("privacy.title")} eyebrow={t("privacy.updated")}/>
            <Text className="font-sans text-[15px] leading-6 text-muted-foreground">{t("privacy.intro")}</Text>
            {sections.map((section, index) => (
                <Section key={section.title} title={section.title} index={Math.min(index, 4)}>
                    <View>
                        <Text className="font-sans text-[15px] leading-6 text-muted-foreground">{section.body}</Text>
                    </View>
                </Section>
            ))}
            <Section title={t("privacy.contact.title")} index={4}>
                <Text className="font-sans text-[15px] leading-6 text-muted-foreground">{t("privacy.contact.body")}</Text>
                <PressScale dimTo={0.5} scaleTo={0.97} role="link" onPress={() => void Linking.openURL(`mailto:${CONTACT_EMAIL}`)} className="self-start" hitSlop={8}>
                    <Text className="font-sans-semibold text-[15px] text-brand">{CONTACT_EMAIL}</Text>
                </PressScale>
            </Section>
        </Screen>
    );
};
