import type {ReactNode} from "react";
import {Modal, Pressable} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {interpolate, useAnimatedStyle} from "react-native-reanimated";
import {AnimatedView} from "@/components/ui/animated";
import {useModalPresence} from "@/hooks/useModalPresence";

type PopoverProps = {
    isOpen: boolean;
    onClose: () => void;
    /** Read by screen readers for the dim area that closes the menu. */
    closeLabel: string;
    children: ReactNode;
};

/**
 * A menu anchored under a top-right button: it grows out of that corner and shrinks back into it,
 * over a page that dims. Used for the profile ⋮ menu and the list sort menu.
 */
export const Popover = ({isOpen, onClose, closeLabel, children}: PopoverProps) => {
    const insets = useSafeAreaInsets();
    const {isRendered, progress} = useModalPresence(isOpen);

    const backdrop = useAnimatedStyle(() => ({opacity: progress.value}));
    const panel = useAnimatedStyle(() => ({
        opacity: progress.value,
        transform: [
            {translateY: interpolate(progress.value, [0, 1], [-8, 0])},
            {scale: interpolate(progress.value, [0, 1], [0.88, 1])},
        ],
    }));

    return (
        <Modal visible={isRendered} transparent animationType="none" onRequestClose={onClose}>
            <AnimatedView className="absolute inset-0 bg-black/40" style={backdrop}>
                <Pressable className="flex-1" onPress={onClose} aria-label={closeLabel}/>
            </AnimatedView>
            <AnimatedView className="absolute right-5 gap-2" style={[{top: insets.top + 60, transformOrigin: "top right"}, panel]}>
                {children}
            </AnimatedView>
        </Modal>
    );
};
