import {useEffect} from "react";
import {Pressable, Text, View} from "react-native";
import {usePathname} from "expo-router";
import {FadeOutDown, SlideInDown, useReducedMotion} from "react-native-reanimated";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {PressScale} from "@/components/motion/PressScale";
import {AnimatedView} from "@/components/ui/animated";
import {toast, useCurrentToast, type ToastTone} from "@/lib/toast";
import {cn} from "@/lib/utils";
import {MAX_CONTENT_WIDTH} from "@/constants/other";
import {TAB_BAR_HEIGHT, TAB_BAR_OFFSET} from "@/layout/TabBar";

/** Pages with the floating tab bar; the toast sits above it there and lower everywhere else. */
const TAB_PATHS = new Set(["/", "/discover", "/calendar", "/stats", "/profile"]);

const DOT: Record<ToastTone, string | null> = {info: null, success: "bg-success", error: "bg-danger"};

/**
 * Draws the toast from `lib/toast`: it slides up from the bottom, leaves by itself after its time,
 * or at once when tapped. Screen readers announce it as it appears.
 */
export const ToastHost = () => {
    const current = useCurrentToast();
    const insets = useSafeAreaInsets();
    const pathname = usePathname();
    const reduced = useReducedMotion();

    useEffect(() => {
        if (!current) return;
        const timer = setTimeout(() => toast.dismiss(current.id), current.duration);
        return () => clearTimeout(timer);
    }, [current]);

    const bottom = insets.bottom + (TAB_PATHS.has(pathname) ? TAB_BAR_HEIGHT + TAB_BAR_OFFSET + 12 : 20);
    const dot = current ? DOT[current.tone] : null;

    return (
        <View pointerEvents="box-none" className="absolute inset-x-0 items-center px-4" style={{bottom}}>
            {current && (
                <AnimatedView
                    // Keyed by id, so a replacing toast plays its own entrance.
                    key={current.id}
                    entering={reduced ? undefined : SlideInDown.springify().damping(20).stiffness(220)}
                    exiting={reduced ? undefined : FadeOutDown.duration(180)}
                    className="w-full"
                    style={{maxWidth: MAX_CONTENT_WIDTH - 32}}
                >
                    <Pressable
                        onPress={() => toast.dismiss(current.id)}
                        role="alert"
                        aria-live="polite"
                        className="min-h-[52px] flex-row items-center gap-3 rounded-2xl border border-border bg-surface-raised py-2 pl-4 pr-2"
                    >
                        {dot && <View className={cn("h-2 w-2 rounded-full", dot)}/>}
                        <Text className="min-w-0 flex-1 py-1.5 font-sans-medium text-sm text-foreground">{current.message}</Text>
                        {current.action ? (
                            <PressScale
                                dimTo={0.6}
                                onPress={() => {
                                    current.action?.onPress();
                                    toast.dismiss(current.id);
                                }}
                                className="h-9 justify-center rounded-xl px-3"
                            >
                                <Text className="font-sans-semibold text-sm text-brand">{current.action.label}</Text>
                            </PressScale>
                        ) : <View className="w-2"/>}
                    </Pressable>
                </AnimatedView>
            )}
        </View>
    );
};
