import {Text, TextInput, View, type TextInputProps} from "react-native";
import Animated from "react-native-reanimated";
import {useCSSVariable, withUniwind} from "uniwind";
import {Reveal} from "@/components/motion/Reveal";
import {useFocusRing} from "@/hooks/useFocusRing";
import {cn} from "@/lib/utils";

const AnimatedTextInput = withUniwind(Animated.createAnimatedComponent(TextInput));

type FormInputProps = TextInputProps & {
    label: string;
    error?: string;
    className?: string;
};

/**
 * Labelled text field with an inline error underneath; pair with react-hook-form's `Controller`.
 * The border brightens on focus and the error fades in, so the field reacts as it is used.
 */
export const FormInput = ({label, error, className, multiline, onFocus, onBlur, style, ...props}: FormInputProps) => {
    const placeholderColor = String(useCSSVariable("--color-subtle-foreground"));
    const ring = useFocusRing(Boolean(error));

    return (
        <View className="gap-1.5">
            <Text className="font-sans-medium text-[13px] text-muted-foreground">{label}</Text>
            <AnimatedTextInput
                aria-label={label}
                aria-invalid={Boolean(error)}
                placeholderTextColor={placeholderColor}
                multiline={multiline}
                className={cn(
                    "rounded-xl border bg-background px-3.5 font-sans text-[15px] text-foreground",
                    multiline ? "min-h-24 py-3" : "h-12",
                    className,
                )}
                style={[multiline ? {textAlignVertical: "top"} : undefined, style, ring.style]}
                onFocus={(event) => {
                    ring.onFocus();
                    onFocus?.(event);
                }}
                onBlur={(event) => {
                    ring.onBlur();
                    onBlur?.(event);
                }}
                {...props}
            />
            {error && (
                <Reveal key={error} variant="fade">
                    <Text className="font-sans text-xs text-danger">{error}</Text>
                </Reveal>
            )}
        </View>
    );
};
