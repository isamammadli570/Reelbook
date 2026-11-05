import type {ComponentProps} from "react";
import {Pressable, Text, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Tabs} from "expo-router";
import {CalendarDays, ChartNoAxesColumn, House, Search, User, type LucideIcon} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {MAX_CONTENT_WIDTH} from "@/constants/other";
import {cn} from "@/lib/utils";

export const TAB_BAR_HEIGHT = 64;
export const TAB_BAR_OFFSET = 16;

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

/** Keyed by the route file name under `src/app/(tabs)`. */
const TAB_ICONS: Record<string, LucideIcon> = {
    index: House,
    discover: Search,
    calendar: CalendarDays,
    stats: ChartNoAxesColumn,
    profile: User,
};

/** The floating pill tab bar: the active tab grows into a light chip with its label. */
export const TabBar = ({state, descriptors, navigateToTab}: TabBarProps) => {
    const insets = useSafeAreaInsets();
    const [background, muted] = useCSSVariable(["--color-background", "--color-subtle-foreground"]);

    return (
        <View pointerEvents="box-none" className="absolute inset-x-0 bottom-0 items-center px-4" style={{paddingBottom: insets.bottom + TAB_BAR_OFFSET}}>
            <View
                role="tablist"
                className="w-full flex-row items-center justify-around rounded-3xl border border-border bg-surface px-2"
                style={{height: TAB_BAR_HEIGHT, maxWidth: MAX_CONTENT_WIDTH - 32}}
            >
                {state.routes.map((route, index) => {
                    const isActive = state.index === index;
                    const label = descriptors[route.key].options.title ?? route.name;
                    const Icon = TAB_ICONS[route.name] ?? House;

                    return (
                        <Pressable
                            key={route.key}
                            role="tab"
                            aria-selected={isActive}
                            aria-label={label}
                            onPress={() => navigateToTab(route.key)}
                            className={cn("h-11 min-w-11 flex-row items-center justify-center gap-1.5 rounded-2xl", isActive && "bg-foreground px-3.5")}
                        >
                            <Icon size={isActive ? 20 : 22} strokeWidth={1.8} color={String(isActive ? background : muted)}/>
                            {isActive && <Text className="font-sans-medium text-[13px] text-background">{label}</Text>}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};
