import {Text, View} from "react-native";
import {Button} from "@/components/ui/button";
import {BottomSheet} from "@/widgets/BottomSheet";

type ConfirmSheetProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: () => void;
    isBusy?: boolean;
};

/** Asks before something that cannot be undone. `Alert` has no buttons on web, so this works everywhere. */
export const ConfirmSheet = ({isOpen, onClose, title, description, confirmLabel, cancelLabel, onConfirm, isBusy}: ConfirmSheetProps) => (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
        <Text className="font-sans text-sm leading-5 text-muted-foreground">{description}</Text>
        <View className="flex-row gap-2 pt-1">
            <Button variant="outline" label={cancelLabel} className="flex-1" onPress={onClose}/>
            <Button variant="primary" label={confirmLabel} className="flex-1 bg-danger" isLoading={isBusy} onPress={onConfirm}/>
        </View>
    </BottomSheet>
);
