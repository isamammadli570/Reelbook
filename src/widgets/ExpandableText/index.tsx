import {useState} from "react";
import {Text, View} from "react-native";
import {LinearTransition} from "react-native-reanimated";
import {useTranslation} from "react-i18next";
import {PressScale} from "@/components/motion/PressScale";
import {AnimatedView} from "@/components/ui/animated";

const COLLAPSED_LINES = 4;

type ExpandableTextProps = {text: string};

/** Long overviews start clamped; a toggle reveals the rest, and the paragraph grows open and shut. */
export const ExpandableText = ({text}: ExpandableTextProps) => {
    const {t} = useTranslation("details");
    const [isExpanded, setIsExpanded] = useState(false);
    const [isClamped, setIsClamped] = useState(false);

    return (
        <View className="gap-1.5">
            <AnimatedView layout={LinearTransition.duration(260)} className="overflow-hidden">
                <Text
                    className="font-sans text-sm leading-[22px] text-muted-foreground"
                    numberOfLines={isExpanded ? undefined : COLLAPSED_LINES}
                    onTextLayout={(event) => {
                        if (!isExpanded) setIsClamped(event.nativeEvent.lines.length >= COLLAPSED_LINES);
                    }}
                >
                    {text}
                </Text>
            </AnimatedView>
            {(isClamped || isExpanded) && (
                <PressScale dimTo={0.5} scaleTo={0.97} onPress={() => setIsExpanded((value) => !value)} aria-expanded={isExpanded} className="self-start py-1">
                    <Text className="font-sans-medium text-sm text-foreground">{isExpanded ? t("readLess") : t("readMore")}</Text>
                </PressScale>
            )}
        </View>
    );
};
