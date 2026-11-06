import type {ReactNode} from "react";
import {KeyboardAvoidingView, Modal, Platform, Pressable, Text, View} from "react-native";
import {interpolate, useAnimatedStyle} from "react-native-reanimated";
import {useTranslation} from "react-i18next";
import {AnimatedView} from "@/components/ui/animated";
import {useModalPresence} from "@/hooks/useModalPresence";
import {MAX_CONTENT_WIDTH} from "@/constants/other";

/** How far below its resting place the sheet starts; enough to clear any sheet's height. */
const SLIDE_DISTANCE = 520;

type BottomSheetProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
};

/**
 * A sheet that slides up over a dimming page and slides back down when closed; tapping the dim area
 * closes it. Both directions run on the UI thread, and the modal unmounts only after the exit finishes.
 */
export const BottomSheet = ({isOpen, onClose, title, children}: BottomSheetProps) => {
    const {t} = useTranslation();
    const {isRendered, progress} = useModalPresence(isOpen);

    const backdrop = useAnimatedStyle(() => ({opacity: progress.value}));
    const panel = useAnimatedStyle(() => ({transform: [{translateY: interpolate(progress.value, [0, 1], [SLIDE_DISTANCE, 0])}]}));

    return (
        <Modal visible={isRendered} transparent animationType="none" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 justify-end">
                <AnimatedView className="absolute inset-0 bg-black/60" style={backdrop}>
                    <Pressable className="flex-1" onPress={onClose} aria-label={t("actions.close")}/>
                </AnimatedView>
                <AnimatedView
                    className="w-full self-center gap-4 rounded-t-3xl border border-border bg-surface px-5 pb-10 pt-3"
                    style={[{maxWidth: MAX_CONTENT_WIDTH, maxHeight: "85%"}, panel]}
                >
                    {/* The grabber: a familiar cue that this is a sheet over the page. */}
                    <View className="h-1 w-10 self-center rounded-full bg-surface-raised"/>
                    <Text role="heading" className="font-serif text-[26px] text-foreground">{title}</Text>
                    {children}
                </AnimatedView>
            </KeyboardAvoidingView>
        </Modal>
    );
};
