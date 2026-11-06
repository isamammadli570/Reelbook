import type {ReactNode} from "react";
import {KeyboardAvoidingView, Modal, Platform, Pressable, Text} from "react-native";
import {SlideInDown} from "react-native-reanimated";
import {useTranslation} from "react-i18next";
import {AnimatedView} from "@/components/ui/animated";
import {MAX_CONTENT_WIDTH} from "@/constants/other";

type BottomSheetProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
};

/** A sheet that slides up from the bottom over a dimmed page; tapping the dim area closes it. */
export const BottomSheet = ({isOpen, onClose, title, children}: BottomSheetProps) => {
    const {t} = useTranslation();

    return (
        <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 justify-end bg-black/60">
                <Pressable className="flex-1" onPress={onClose} aria-label={t("actions.close")}/>
                <AnimatedView
                    entering={SlideInDown.duration(320).springify().damping(20)}
                    className="w-full self-center gap-4 rounded-t-3xl border border-border bg-surface px-5 pb-10 pt-5"
                    style={{maxWidth: MAX_CONTENT_WIDTH, maxHeight: "85%"}}
                >
                    <Text role="heading" className="font-serif text-[26px] text-foreground">{title}</Text>
                    {children}
                </AnimatedView>
            </KeyboardAvoidingView>
        </Modal>
    );
};
