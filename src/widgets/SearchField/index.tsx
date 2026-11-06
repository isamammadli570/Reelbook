import {TextInput} from "react-native";
import {useTranslation} from "react-i18next";
import {Search, X} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {PressScale} from "@/components/motion/PressScale";
import {Reveal} from "@/components/motion/Reveal";
import {AnimatedView} from "@/components/ui/animated";
import {useFocusRing} from "@/hooks/useFocusRing";

type SearchFieldProps = {
    value: string;
    onChangeText: (value: string) => void;
    label: string;
    placeholder: string;
    /** The keyboard's search key was pressed. */
    onSubmit?: () => void;
};

/** Search box with a leading icon; its border brightens on focus and a clear button fades in once there is text. */
export const SearchField = ({value, onChangeText, label, placeholder, onSubmit}: SearchFieldProps) => {
    const {t} = useTranslation();
    const muted = String(useCSSVariable("--color-subtle-foreground"));
    const ring = useFocusRing();

    return (
        <AnimatedView className="h-[52px] flex-row items-center gap-2.5 rounded-2xl border bg-surface px-4" style={ring.style}>
            <Search size={20} strokeWidth={1.8} color={muted}/>
            <TextInput
                aria-label={label}
                value={value}
                onChangeText={onChangeText}
                onFocus={ring.onFocus}
                onBlur={ring.onBlur}
                placeholder={placeholder}
                placeholderTextColor={muted}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                onSubmitEditing={onSubmit}
                className="flex-1 font-sans text-[15px] text-foreground"
            />
            {value.length > 0 && (
                <Reveal variant="pop">
                    <PressScale onPress={() => onChangeText("")} aria-label={t("actions.clear")} hitSlop={10} className="h-6 w-6 items-center justify-center rounded-full bg-surface-raised">
                        <X size={14} strokeWidth={2.5} color={muted}/>
                    </PressScale>
                </Reveal>
            )}
        </AnimatedView>
    );
};
