import {useTranslation} from "react-i18next";
import {SegmentedControl} from "@/components/ui/segmented-control";
import {Section} from "@/widgets/Section";
import {useLanguage} from "@/hooks/useLanguage";
import {LANGUAGE_LABELS, SUPPORTED_LANGUAGES} from "@/i18n/resources";

/** AZ / EN / RU switch; the choice is remembered over the device language. */
export const LanguagePicker = () => {
    const {t} = useTranslation("profile");
    const {language, changeLanguage} = useLanguage();
    const options = SUPPORTED_LANGUAGES.map((value) => ({value, label: LANGUAGE_LABELS[value]}));

    return (
        <Section title={t("language")}>
            <SegmentedControl options={options} value={language} onChange={changeLanguage} label={t("language")}/>
        </Section>
    );
};
