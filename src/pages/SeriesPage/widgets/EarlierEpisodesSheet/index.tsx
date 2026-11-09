import {useState} from "react";
import {Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {Check} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {PressScale} from "@/components/motion/PressScale";
import {Button} from "@/components/ui/button";
import {BottomSheet} from "@/widgets/BottomSheet";
import {cn} from "@/lib/utils";

type EarlierEpisodesSheetProps = {
    isOpen: boolean;
    /** How many earlier episodes are not marked yet. */
    count: number;
    /** `remember` keeps the answer, so the question is not asked again. */
    onAnswer: (markEarlier: boolean, remember: boolean) => void;
    onClose: () => void;
};

/** Asked when an episode is marked while earlier ones are not: mark those too, or only this one. */
export const EarlierEpisodesSheet = ({isOpen, count, onAnswer, onClose}: EarlierEpisodesSheetProps) => {
    const {t} = useTranslation("details");
    const [ink, foreground] = useCSSVariable(["--color-background", "--color-foreground"]).map(String);
    const [isRemembered, setIsRemembered] = useState(false);

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title={t("earlier.title")}>
            <Text className="font-sans text-sm leading-5 text-muted-foreground">{t("earlier.description", {count})}</Text>
            <PressScale
                role="checkbox"
                aria-checked={isRemembered}
                onPress={() => setIsRemembered((value) => !value)}
                className="flex-row items-center gap-2.5 py-1"
            >
                <View className={cn("h-5 w-5 items-center justify-center rounded-md", isRemembered ? "bg-foreground" : "border-[1.5px] border-border")}>
                    {isRemembered && <Check size={14} strokeWidth={3} color={ink}/>}
                </View>
                <Text className="font-sans text-sm text-foreground" style={{color: foreground}}>{t("earlier.remember")}</Text>
            </PressScale>
            <View className="flex-row gap-2 pt-1">
                <Button variant="outline" label={t("earlier.onlyThis")} className="flex-1" onPress={() => onAnswer(false, isRemembered)}/>
                <Button variant="primary" label={t("earlier.markAll")} className="flex-1" onPress={() => onAnswer(true, isRemembered)}/>
            </View>
        </BottomSheet>
    );
};
