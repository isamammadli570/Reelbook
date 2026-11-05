import {Pressable, Text} from "react-native";
import {useTranslation} from "react-i18next";
import {EmptyState} from "@/widgets/EmptyState";

type QueryErrorStateProps = {
    error: Error | null;
    onRetry: () => void;
};

/** A failed request in place of its content, with a retry button. */
export const QueryErrorState = ({error, onRetry}: QueryErrorStateProps) => {
    const {t} = useTranslation();

    return (
        <EmptyState
            title={t("errors.load")}
            description={error?.message}
            action={(
                <Pressable onPress={onRetry} className="h-11 items-center justify-center rounded-xl bg-foreground px-5">
                    <Text className="font-sans-semibold text-sm text-background">{t("actions.retry")}</Text>
                </Pressable>
            )}
        />
    );
};
