import {Pressable, Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {Check} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {BottomSheet} from "@/widgets/BottomSheet";
import {useLanguage} from "@/hooks/useLanguage";
import {haptics} from "@/lib/haptics";
import {cn} from "@/lib/utils";
import {LANGUAGE_LABELS, SUPPORTED_LANGUAGES} from "@/i18n/resources";

type LanguageSheetProps = {
    isOpen: boolean;
    onClose: () => void;
};

/** AZ / EN / RU; the choice is remembered over the device language and applies at once. */
export const LanguageSheet = ({isOpen, onClose}: LanguageSheetProps) => {
    const {t} = useTranslation("settings");
    const {language, changeLanguage} = useLanguage();
    const foreground = String(useCSSVariable("--color-foreground"));

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title={t("app.language")}>
            <View role="radiogroup" className="overflow-hidden rounded-2xl bg-background">
                {SUPPORTED_LANGUAGES.map((value, index) => {
                    const isSelected = value === language;
                    return (
                        <Pressable
                            key={value}
                            role="radio"
                            aria-checked={isSelected}
                            onPress={() => {
                                haptics.tap();
                                changeLanguage(value);
                                onClose();
                            }}
                            className={cn("flex-row items-center justify-between px-4 py-3.5 active:bg-surface-raised", index > 0 && "border-t border-border")}
                        >
                            <Text className="font-sans-medium text-[15px] text-foreground">{LANGUAGE_LABELS[value]}</Text>
                            {isSelected && <Check size={18} strokeWidth={2.5} color={foreground}/>}
                        </Pressable>
                    );
                })}
            </View>
        </BottomSheet>
    );
};
