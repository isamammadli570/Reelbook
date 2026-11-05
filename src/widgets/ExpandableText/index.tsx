import {useState} from "react";
import {Pressable, Text, View} from "react-native";
import {useTranslation} from "react-i18next";

const COLLAPSED_LINES = 4;

type ExpandableTextProps = {text: string};

/** Long overviews start clamped; a toggle reveals the rest. */
export const ExpandableText = ({text}: ExpandableTextProps) => {
    const {t} = useTranslation("details");
    const [isExpanded, setIsExpanded] = useState(false);
    const [isClamped, setIsClamped] = useState(false);

    return (
        <View className="gap-1.5">
            <Text
                className="font-sans text-sm leading-[22px] text-muted-foreground"
                numberOfLines={isExpanded ? undefined : COLLAPSED_LINES}
                onTextLayout={(event) => {
                    if (!isExpanded) setIsClamped(event.nativeEvent.lines.length >= COLLAPSED_LINES);
                }}
            >
                {text}
            </Text>
            {(isClamped || isExpanded) && (
                <Pressable onPress={() => setIsExpanded((value) => !value)} aria-expanded={isExpanded} className="self-start py-1">
                    <Text className="font-sans-medium text-sm text-foreground">{isExpanded ? t("readLess") : t("readMore")}</Text>
                </Pressable>
            )}
        </View>
    );
};
