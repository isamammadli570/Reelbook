import {Children, Fragment, isValidElement, type ReactNode} from "react";
import {Pressable, Switch, Text, View} from "react-native";
import {ChevronRight, type LucideIcon} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {Reveal} from "@/components/motion/Reveal";
import {cn} from "@/lib/utils";

/** System-style tile colours, one per kind of setting, so a row is found by colour before it is read. */
export const SETTINGS_TINT = {
    blue: "#0A84FF",
    green: "#30D158",
    red: "#FF453A",
    orange: "#FF9F0A",
    indigo: "#5E5CE6",
    purple: "#BF5AF2",
    pink: "#FF375F",
    gray: "#8E8E93",
} as const;
export type SettingsTint = keyof typeof SETTINGS_TINT;

type SettingsGroupProps = {
    title?: string;
    /** A note under the group, for what a switch does. */
    footer?: string;
    children: ReactNode;
    index?: number;
};

/** A titled card of rows split by hairlines, like the system settings app. */
export const SettingsGroup = ({title, footer, children, index = 0}: SettingsGroupProps) => {
    const rows = Children.toArray(children).filter(isValidElement);
    if (!rows.length) return null;

    return (
        <Reveal index={index} variant="rise" className="gap-2">
            {title && <Text className="px-1 font-sans-medium text-xs uppercase tracking-wider text-muted-foreground">{title}</Text>}
            <View className="overflow-hidden rounded-2xl bg-surface">
                {rows.map((row, position) => (
                    <Fragment key={row.key ?? position}>
                        {position > 0 && <View className="ml-[60px] h-px bg-border"/>}
                        {row}
                    </Fragment>
                ))}
            </View>
            {footer && <Text className="px-1 font-sans text-xs leading-[18px] text-muted-foreground">{footer}</Text>}
        </Reveal>
    );
};

type SettingsRowProps = {
    icon: LucideIcon;
    tint: SettingsTint;
    label: string;
    /** Current choice shown before the chevron, such as the language. */
    value?: string;
    onPress?: () => void;
    /** Shows a switch instead of a chevron. */
    toggle?: {value: boolean; onChange: (value: boolean) => void; isDisabled?: boolean};
    /** A link that leaves the screen it opens on, drawn without a chevron. */
    isDanger?: boolean;
};

/** One setting: a coloured icon tile, the label, and a value, chevron or switch. */
export const SettingsRow = ({icon: Icon, tint, label, value, onPress, toggle, isDanger}: SettingsRowProps) => {
    const [muted, brand, track] = useCSSVariable(["--color-subtle-foreground", "--color-brand", "--color-border"]).map(String);

    const content = (
        <>
            <View className="h-8 w-8 items-center justify-center rounded-lg" style={{backgroundColor: SETTINGS_TINT[tint]}}>
                <Icon size={18} strokeWidth={2} color="#FFFFFF"/>
            </View>
            <Text className={cn("min-w-0 flex-1 font-sans-medium text-[15px]", isDanger ? "text-danger" : "text-foreground")} numberOfLines={1}>{label}</Text>
            {value && <Text className="max-w-[45%] font-sans text-[15px] text-muted-foreground" numberOfLines={1}>{value}</Text>}
            {toggle ? (
                <Switch
                    value={toggle.value}
                    disabled={toggle.isDisabled}
                    onValueChange={toggle.onChange}
                    aria-label={label}
                    trackColor={{true: brand, false: track}}
                />
            ) : onPress && !isDanger ? (
                <ChevronRight size={18} strokeWidth={2} color={muted}/>
            ) : null}
        </>
    );

    if (toggle || !onPress) return <View className="min-h-[52px] flex-row items-center gap-3 px-3.5 py-2">{content}</View>;

    return (
        <Pressable onPress={onPress} role="button" className="min-h-[52px] flex-row items-center gap-3 px-3.5 py-2 active:bg-surface-raised">
            {content}
        </Pressable>
    );
};
