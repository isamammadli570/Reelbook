import {Pressable, Text, View} from "react-native";
import {cn} from "@/lib/utils";

type SegmentedOption<TValue extends string> = {value: TValue; label: string};

type SegmentedControlProps<TValue extends string> = {
    options: SegmentedOption<TValue>[];
    value: TValue;
    onChange: (value: TValue) => void;
    label?: string;
    className?: string;
};

/** A pill row of mutually exclusive tabs, e.g. All / Movies / Series. */
export const SegmentedControl = <TValue extends string>({options, value, onChange, label, className}: SegmentedControlProps<TValue>) => (
    <View role="tablist" aria-label={label} className={cn("flex-row gap-1 rounded-2xl bg-surface p-1", className)}>
        {options.map((option) => {
            const isSelected = option.value === value;
            return (
                <Pressable
                    key={option.value}
                    role="tab"
                    aria-selected={isSelected}
                    onPress={() => onChange(option.value)}
                    className={cn("h-9 flex-1 items-center justify-center rounded-xl", isSelected && "bg-foreground")}
                >
                    <Text className={cn("font-sans-medium text-[13px]", isSelected ? "text-background" : "text-muted-foreground")}>{option.label}</Text>
                </Pressable>
            );
        })}
    </View>
);
