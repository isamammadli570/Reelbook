import {Pressable, type StyleProp, type ViewStyle} from "react-native";
import {useTranslation} from "react-i18next";
import {ChevronLeft} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {useGoBack} from "@/hooks/useGoBack";
import {cn} from "@/lib/utils";

type BackButtonProps = {
    className?: string;
    /** For the safe-area offset, which only exists at runtime. */
    style?: StyleProp<ViewStyle>;
};

/** Round translucent back button that reads over a backdrop image. */
export const BackButton = ({className, style}: BackButtonProps) => {
    const {t} = useTranslation("details");
    const goBack = useGoBack();
    const foreground = String(useCSSVariable("--color-foreground"));

    return (
        <Pressable onPress={goBack} aria-label={t("back")} className={cn("h-11 w-11 items-center justify-center rounded-full bg-black/50", className)} style={style}>
            <ChevronLeft size={24} strokeWidth={2} color={foreground}/>
        </Pressable>
    );
};
