import {useEffect, useRef, useState, type ComponentProps} from "react";
import {Text, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {Tabs} from "expo-router";
import {CalendarDays, ChartNoAxesColumn, House, Search, User, type LucideIcon} from "lucide-react-native";
import {useAnimatedStyle, useReducedMotion, useSharedValue, withSpring} from "react-native-reanimated";
import {useCSSVariable} from "uniwind";
import {PopOnActivate} from "@/components/motion/PopOnActivate";
import {PressScale} from "@/components/motion/PressScale";
import {Reveal} from "@/components/motion/Reveal";
import {AnimatedView} from "@/components/ui/animated";
import {MAX_CONTENT_WIDTH} from "@/constants/other";
import {SPRING} from "@/lib/motion";
import {cn} from "@/lib/utils";

export const TAB_BAR_HEIGHT = 64;
export const TAB_BAR_OFFSET = 16;

const INDICATOR_HEIGHT = 44;

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];
type TabLayout = {x: number; width: number};

/** Keyed by the route file name under `src/app/(tabs)`. */
const TAB_ICONS: Record<string, LucideIcon> = {
    index: House,
    discover: Search,
    calendar: CalendarDays,
    stats: ChartNoAxesColumn,
    profile: User,
};

/**
 * The floating pill tab bar. The light pill behind the active tab is one shared shape that slides
 * to the next tab and stretches to fit its label, instead of appearing on each tab separately.
 */
export const TabBar = ({state, descriptors, navigateToTab}: TabBarProps) => {
    const insets = useSafeAreaInsets();
    const [background, muted] = useCSSVariable(["--color-background", "--color-subtle-foreground"]);
    const reduced = useReducedMotion();

    const indicatorX = useSharedValue(0);
    const indicatorWidth = useSharedValue(0);
    const layouts = useRef<Record<number, TabLayout>>({});
    // Bumped whenever a tab reports its size, so the indicator follows labels that change width.
    const [layoutVersion, setLayoutVersion] = useState(0);

    useEffect(() => {
        const layout = layouts.current[state.index];
        if (!layout) return;
        if (reduced) {
            indicatorX.value = layout.x;
            indicatorWidth.value = layout.width;
            return;
        }
        indicatorX.value = withSpring(layout.x, SPRING);
        indicatorWidth.value = withSpring(layout.width, SPRING);
    }, [state.index, layoutVersion, reduced, indicatorX, indicatorWidth]);

    const indicatorStyle = useAnimatedStyle(() => ({
        width: indicatorWidth.value,
        transform: [{translateX: indicatorX.value}],
    }));

    return (
        <View pointerEvents="box-none" className="absolute inset-x-0 bottom-0 items-center px-4" style={{paddingBottom: insets.bottom + TAB_BAR_OFFSET}}>
            <View
                role="tablist"
                className="w-full flex-row items-center justify-around rounded-3xl border border-border bg-surface px-2"
                style={{height: TAB_BAR_HEIGHT, maxWidth: MAX_CONTENT_WIDTH - 32}}
            >
                <AnimatedView
                    pointerEvents="none"
                    className="bg-foreground"
                    style={[{position: "absolute", left: 0, top: (TAB_BAR_HEIGHT - INDICATOR_HEIGHT) / 2, height: INDICATOR_HEIGHT, borderRadius: 16}, indicatorStyle]}
                />
                {state.routes.map((route, index) => {
                    const isActive = state.index === index;
                    const label = descriptors[route.key].options.title ?? route.name;
                    const Icon = TAB_ICONS[route.name] ?? House;

                    return (
                        <PressScale
                            key={route.key}
                            role="tab"
                            aria-selected={isActive}
                            aria-label={label}
                            onPress={() => navigateToTab(route.key)}
                            onLayout={(event) => {
                                layouts.current[index] = {x: event.nativeEvent.layout.x, width: event.nativeEvent.layout.width};
                                setLayoutVersion((version) => version + 1);
                            }}
                            className={cn("h-11 min-w-11 flex-row items-center justify-center gap-1.5 rounded-2xl", isActive && "px-3.5")}
                        >
                            <PopOnActivate active={isActive}>
                                <Icon size={isActive ? 20 : 22} strokeWidth={1.8} color={String(isActive ? background : muted)}/>
                            </PopOnActivate>
                            {isActive && (
                                <Reveal variant="fade" className="flex-row">
                                    <Text className="font-sans-medium text-[13px] text-background">{label}</Text>
                                </Reveal>
                            )}
                        </PressScale>
                    );
                })}
            </View>
        </View>
    );
};
