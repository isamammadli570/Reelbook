import type {ReactNode} from "react";
import {Text, View} from "react-native";
import {Reveal} from "@/components/motion/Reveal";
import {cn} from "@/lib/utils";

type EmptyStateProps = {
    title: string;
    description?: string;
    icon?: ReactNode;
    action?: ReactNode;
    className?: string;
};

/** Shown when a list has nothing yet: an invitation, not an apology. */
export const EmptyState = ({title, description, icon, action, className}: EmptyStateProps) => (
    <Reveal variant="fade" className={cn("items-center gap-2 rounded-2xl border border-border bg-surface px-6 py-8", className)}>
        {icon}
        <Text className="text-center font-sans-semibold text-[15px] text-foreground">{title}</Text>
        {description && <Text className="text-center font-sans text-[13px] leading-5 text-muted-foreground">{description}</Text>}
        {action && <View className="mt-2">{action}</View>}
    </Reveal>
);
