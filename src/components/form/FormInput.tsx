import {Text, TextInput, View, type TextInputProps} from "react-native";
import {useCSSVariable} from "uniwind";
import {cn} from "@/lib/utils";

type FormInputProps = TextInputProps & {
    label: string;
    error?: string;
    className?: string;
};

/** Labelled text field with an inline error underneath; pair with react-hook-form's `Controller`. */
export const FormInput = ({label, error, className, multiline, ...props}: FormInputProps) => {
    const placeholderColor = String(useCSSVariable("--color-subtle-foreground"));

    return (
        <View className="gap-1.5">
            <Text className="font-sans-medium text-[13px] text-muted-foreground">{label}</Text>
            <TextInput
                aria-label={label}
                aria-invalid={Boolean(error)}
                placeholderTextColor={placeholderColor}
                multiline={multiline}
                className={cn(
                    "rounded-xl border bg-background px-3.5 font-sans text-[15px] text-foreground",
                    multiline ? "min-h-24 py-3" : "h-12",
                    error ? "border-danger" : "border-border",
                    className,
                )}
                style={multiline ? {textAlignVertical: "top"} : undefined}
                {...props}
            />
            {error && <Text className="font-sans text-xs text-danger">{error}</Text>}
        </View>
    );
};
