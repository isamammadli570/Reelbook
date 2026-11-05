import {Pressable, Text, type PressableProps} from "react-native";
import type {LucideIcon} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {cn} from "@/lib/utils";

const VARIANTS = {
    primary: {container: "bg-foreground", text: "text-background", iconColor: "--color-background"},
    brand: {container: "bg-brand", text: "text-brand-ink", iconColor: "--color-brand-ink"},
    secondary: {container: "bg-surface", text: "text-foreground", iconColor: "--color-foreground"},
    outline: {container: "border border-border", text: "text-foreground", iconColor: "--color-foreground"},
} as const;
export type ButtonVariant = keyof typeof VARIANTS;

type ButtonProps = Omit<PressableProps, "children"> & {
    label?: string;
    icon?: LucideIcon;
    /** Paints the icon filled, for "on" toggles like a favourited heart. */
    isIconFilled?: boolean;
    variant?: ButtonVariant;
    className?: string;
};

/** Pill button with an optional leading icon; icon-only when there is no label (give it an `aria-label`). */
export const Button = ({label, icon: Icon, isIconFilled, variant = "secondary", className, ...props}: ButtonProps) => {
    const styles = VARIANTS[variant];
    const iconColor = String(useCSSVariable(styles.iconColor));

    return (
        <Pressable
            className={cn("h-12 flex-row items-center justify-center gap-2 rounded-2xl active:opacity-80", label ? "px-4" : "w-12", styles.container, className)}
            {...props}
        >
            {Icon && <Icon size={20} strokeWidth={2} color={iconColor} fill={isIconFilled ? iconColor : "transparent"}/>}
            {label && <Text className={cn("font-sans-semibold text-[15px]", styles.text)}>{label}</Text>}
        </Pressable>
    );
};
