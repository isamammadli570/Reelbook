import {ActivityIndicator, Text, type PressableProps} from "react-native";
import type {LucideIcon} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {PopOnActivate} from "@/components/motion/PopOnActivate";
import {PressScale} from "@/components/motion/PressScale";
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
    /**
     * Waiting on the network: a spinner takes the icon's place and presses are ignored. The label stays, so the
     * button keeps its size and still says what it is doing.
     */
    isLoading?: boolean;
    variant?: ButtonVariant;
    className?: string;
};

/** Pill button with an optional leading icon; icon-only when there is no label (give it an `aria-label`). */
export const Button = ({label, icon: Icon, isIconFilled, isLoading = false, variant = "secondary", className, disabled, ...props}: ButtonProps) => {
    const styles = VARIANTS[variant];
    const iconColor = String(useCSSVariable(styles.iconColor));

    return (
        <PressScale
            className={cn("h-12 flex-row items-center justify-center gap-2 rounded-2xl", label ? "px-4" : "w-12", styles.container, disabled && !isLoading && "opacity-50", className)}
            disabled={disabled || isLoading}
            aria-busy={isLoading}
            {...props}
        >
            {isLoading ? (
                <ActivityIndicator size="small" color={iconColor}/>
            ) : Icon ? (
                <PopOnActivate active={Boolean(isIconFilled)}>
                    <Icon size={20} strokeWidth={2} color={iconColor} fill={isIconFilled ? iconColor : "transparent"}/>
                </PopOnActivate>
            ) : null}
            {label ? <Text className={cn("shrink font-sans-semibold text-[15px]", styles.text)} numberOfLines={1}>{label}</Text> : null}
        </PressScale>
    );
};
