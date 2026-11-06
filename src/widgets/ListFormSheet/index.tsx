import {View} from "react-native";
import {Controller, useForm} from "react-hook-form";
import {useTranslation} from "react-i18next";
import {Button} from "@/components/ui/button";
import {FormInput} from "@/components/form/FormInput";
import {BottomSheet} from "@/widgets/BottomSheet";
import {LIST_LIMITS} from "@/constants/other";
import type {ListDetails} from "@/helpers/lists";

const EMPTY_DETAILS: ListDetails = {name: "", description: ""};

type ListFormSheetProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    submitLabel: string;
    initial?: ListDetails;
    /** Resolves `true` when saved; the sheet closes only then. */
    onSubmit: (details: ListDetails) => Promise<boolean>;
};

/** Name and description of a list, for creating one or renaming it. */
export const ListFormSheet = ({isOpen, onClose, title, submitLabel, initial = EMPTY_DETAILS, onSubmit}: ListFormSheetProps) => {
    const {t} = useTranslation("lists");
    const {control, handleSubmit, reset, formState: {errors, isSubmitting}} = useForm<ListDetails>({mode: "onTouched", values: initial});

    const close = () => {
        reset(initial);
        onClose();
    };

    const submit = handleSubmit(async (details) => {
        if (await onSubmit(details)) {
            reset(EMPTY_DETAILS);
            onClose();
        }
    });

    return (
        <BottomSheet isOpen={isOpen} onClose={close} title={title}>
            <Controller
                control={control}
                name="name"
                rules={{
                    validate: (value) => value.trim().length > 0 || t("form.nameRequired"),
                    maxLength: {value: LIST_LIMITS.NAME_MAX, message: t("form.tooLong", {max: LIST_LIMITS.NAME_MAX})},
                }}
                render={({field: {value, onChange, onBlur}}) => (
                    <FormInput label={t("form.name")} placeholder={t("form.namePlaceholder")} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.name?.message}/>
                )}
            />
            <Controller
                control={control}
                name="description"
                rules={{maxLength: {value: LIST_LIMITS.DESCRIPTION_MAX, message: t("form.tooLong", {max: LIST_LIMITS.DESCRIPTION_MAX})}}}
                render={({field: {value, onChange, onBlur}}) => (
                    <FormInput label={t("form.description")} placeholder={t("form.descriptionPlaceholder")} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.description?.message} multiline/>
                )}
            />
            <View className="flex-row gap-2 pt-1">
                <Button variant="outline" label={t("form.cancel")} className="flex-1" onPress={close}/>
                <Button variant="brand" label={submitLabel} className="flex-1" disabled={isSubmitting} onPress={() => void submit()}/>
            </View>
        </BottomSheet>
    );
};
