import {Text, View} from "react-native";
import {ChevronRight} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {PressScale} from "@/components/motion/PressScale";

type RowHeaderProps = {
    title: string;
    /** A count or a link name on the right; with `onPress` the whole header opens the full list. */
    aside?: string;
    onPress?: () => void;
};

/** A profile row's title, with what opens it on the right. */
export const RowHeader = ({title, aside, onPress}: RowHeaderProps) => {
    const muted = String(useCSSVariable("--color-muted-foreground"));

    return (
        <PressScale scaleTo={0.98} onPress={onPress} disabled={!onPress} className="flex-row items-center justify-between" aria-label={aside ? `${title}, ${aside}` : title}>
            <Text role="heading" className="font-serif text-[26px] text-foreground">{title}</Text>
            {onPress && aside && (
                <View className="flex-row items-center gap-1">
                    <Text className="font-sans-medium text-[15px] text-muted-foreground">{aside}</Text>
                    <ChevronRight size={20} strokeWidth={2} color={muted}/>
                </View>
            )}
        </PressScale>
    );
};
