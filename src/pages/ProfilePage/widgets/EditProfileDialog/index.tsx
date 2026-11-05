import {KeyboardAvoidingView, Modal, Platform, Pressable, Text, View} from "react-native";
import {Controller, useForm} from "react-hook-form";
import {useTranslation} from "react-i18next";
import {Button} from "@/components/ui/button";
import {FormInput} from "@/components/form/FormInput";
import {useSaveProfile} from "@/hooks/profile";
import {MAX_CONTENT_WIDTH, PROFILE_LIMITS} from "@/constants/other";
import type {Profile} from "@/api/profile.api";

type EditProfileDialogProps = {
    profile: Profile;
    isOpen: boolean;
    onClose: () => void;
};

/** Bottom sheet with the name and bio fields; closes only after the profile is saved. */
export const EditProfileDialog = ({profile, isOpen, onClose}: EditProfileDialogProps) => {
    const {t} = useTranslation("profile");
    const {mutateAsync: saveProfile, isPending} = useSaveProfile();
    const {control, handleSubmit, reset, formState: {errors}} = useForm<Profile>({mode: "onTouched", values: profile});

    const close = () => {
        reset(profile);
        onClose();
    };

    const save = handleSubmit(async (values) => {
        const isSaved = await saveProfile(values).then(() => true, () => false);
        if (isSaved) onClose();
    });

    const maxLength = (max: number) => ({value: max, message: t("editDialog.tooLong", {max})});

    return (
        <Modal visible={isOpen} transparent animationType="fade" onRequestClose={close}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 justify-end bg-black/60">
                <Pressable className="flex-1" onPress={close} aria-label={t("editDialog.cancel")}/>
                <View className="w-full self-center gap-4 rounded-t-3xl border border-border bg-surface px-5 pb-10 pt-5" style={{maxWidth: MAX_CONTENT_WIDTH}}>
                    <Text role="heading" className="font-serif text-[28px] text-foreground">{t("editDialog.title")}</Text>
                    <Controller
                        control={control}
                        name="name"
                        rules={{maxLength: maxLength(PROFILE_LIMITS.NAME_MAX)}}
                        render={({field: {value, onChange, onBlur}}) => (
                            <FormInput label={t("editDialog.name")} placeholder={t("editDialog.namePlaceholder")} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.name?.message} autoCapitalize="words"/>
                        )}
                    />
                    <Controller
                        control={control}
                        name="bio"
                        rules={{maxLength: maxLength(PROFILE_LIMITS.BIO_MAX)}}
                        render={({field: {value, onChange, onBlur}}) => (
                            <FormInput label={t("editDialog.bio")} placeholder={t("editDialog.bioPlaceholder")} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.bio?.message} multiline/>
                        )}
                    />
                    <View className="flex-row gap-2 pt-1">
                        <Button variant="outline" label={t("editDialog.cancel")} className="flex-1" onPress={close}/>
                        <Button variant="primary" label={t("editDialog.save")} className="flex-1" disabled={isPending} onPress={() => void save()}/>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};
