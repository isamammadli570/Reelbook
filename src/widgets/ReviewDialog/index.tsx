import {KeyboardAvoidingView, Modal, Platform, Pressable, Text, View} from "react-native";
import {Controller, useForm} from "react-hook-form";
import {useTranslation} from "react-i18next";
import {SlideInDown} from "react-native-reanimated";
import {Button} from "@/components/ui/button";
import {AnimatedView} from "@/components/ui/animated";
import {FormInput} from "@/components/form/FormInput";
import {useSaveReview} from "@/hooks/library";
import {MAX_CONTENT_WIDTH, REVIEW_MAX_LENGTH} from "@/constants/other";
import type {LibraryItem, MediaSnapshot} from "@/api/library.api";

type ReviewFormValues = {text: string};

type ReviewDialogProps = {
    snapshot: MediaSnapshot;
    item: LibraryItem | undefined;
    isOpen: boolean;
    onClose: () => void;
};

/** Bottom sheet for writing or editing the review of one title. Closes only after the save succeeds. */
export const ReviewDialog = ({snapshot, item, isOpen, onClose}: ReviewDialogProps) => {
    const {t} = useTranslation("details");
    const {mutateAsync: saveReview, isPending} = useSaveReview();
    const current = item?.review?.text ?? "";
    const {control, handleSubmit, reset, formState: {errors}} = useForm<ReviewFormValues>({mode: "onTouched", values: {text: current}});

    const close = () => {
        reset({text: current});
        onClose();
    };

    const save = handleSubmit(async ({text}) => {
        const isSaved = await saveReview({snapshot, text}).then(() => true, () => false);
        if (isSaved) onClose();
    });

    return (
        <Modal visible={isOpen} transparent animationType="fade" onRequestClose={close}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 justify-end bg-black/60">
                <Pressable className="flex-1" onPress={close} aria-label={t("review.cancel")}/>
                <AnimatedView entering={SlideInDown.duration(320).springify().damping(20)} className="w-full self-center gap-4 rounded-t-3xl border border-border bg-surface px-5 pb-10 pt-5" style={{maxWidth: MAX_CONTENT_WIDTH}}>
                    <Text role="heading" className="font-serif text-[28px] text-foreground">{t("review.title")}</Text>
                    <Controller
                        control={control}
                        name="text"
                        rules={{maxLength: {value: REVIEW_MAX_LENGTH, message: t("review.tooLong", {max: REVIEW_MAX_LENGTH})}}}
                        render={({field: {value, onChange, onBlur}}) => (
                            <FormInput
                                label={t("review.label")}
                                placeholder={t("review.placeholder")}
                                value={value}
                                onChangeText={onChange}
                                onBlur={onBlur}
                                error={errors.text?.message}
                                multiline
                                className="min-h-32"
                            />
                        )}
                    />
                    <View className="flex-row gap-2 pt-1">
                        <Button variant="outline" label={t("review.cancel")} className="flex-1" onPress={close}/>
                        <Button variant="primary" label={t("review.save")} className="flex-1" disabled={isPending} onPress={() => void save()}/>
                    </View>
                </AnimatedView>
            </KeyboardAvoidingView>
        </Modal>
    );
};
