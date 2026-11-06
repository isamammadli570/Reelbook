import type {ReactNode} from "react";
import {Text} from "react-native";
import {PopOnActivate} from "@/components/motion/PopOnActivate";
import {PressScale} from "@/components/motion/PressScale";
import {cn} from "@/lib/utils";

type ChipProps = {
    label: string;
    isSelected: boolean;
    onPress: () => void;
    /** Something before the label, such as a service logo. */
    leading?: ReactNode;
    /** Something after it, such as a × to remove the filter. */
    trailing?: ReactNode;
};

/** A pill choice: filled when chosen, outlined otherwise; it pops when it turns on. */
export const Chip = ({label, isSelected, onPress, leading, trailing}: ChipProps) => (
    <PopOnActivate active={isSelected}>
        <PressScale
            role="checkbox"
            aria-checked={isSelected}
            onPress={onPress}
            scaleTo={0.95}
            className={cn("h-9 flex-row items-center gap-1.5 rounded-full border px-3.5", isSelected ? "border-foreground bg-foreground" : "border-border bg-surface")}
        >
            {leading}
            <Text className={cn("font-sans-medium text-[13px]", isSelected ? "text-background" : "text-foreground")} numberOfLines={1}>{label}</Text>
            {trailing}
        </PressScale>
    </PopOnActivate>
);
