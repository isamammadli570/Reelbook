import {useMemo, useState} from "react";
import {Pressable, Text, View} from "react-native";
import {router, useLocalSearchParams} from "expo-router";
import {useTranslation} from "react-i18next";
import {Pencil, Trash2} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {Reveal} from "@/components/motion/Reveal";
import {AccountRequired} from "@/widgets/AccountRequired";
import {BackButton} from "@/widgets/BackButton";
import {ConfirmSheet} from "@/widgets/ConfirmSheet";
import {EmptyState} from "@/widgets/EmptyState";
import {ListFormSheet} from "@/widgets/ListFormSheet";
import {PosterGrid} from "@/widgets/PosterGrid";
import {Screen} from "@/widgets/Screen";
import {useSession} from "@/hooks/auth/useSession";
import {useDeleteList, useRemoveFromList, useUpdateList, useUserList} from "@/hooks/lists";
import {entryToMediaSummary} from "@/helpers/lists";
import {itemKey} from "@/helpers/library";
import {hasSupabase} from "@/lib/env";
import {cn} from "@/lib/utils";
import {buildRoute} from "@/constants/routes";

const GRID_COLUMNS = 3;

/** One list: its name and description, its titles three across, and editing, removing titles and deleting it. */
export const UserListPage = () => {
    const {id} = useLocalSearchParams<{id: string}>();
    const {t} = useTranslation("lists");
    const foreground = String(useCSSVariable("--color-foreground"));
    const {session, isLoading: isSessionLoading} = useSession();
    const {list} = useUserList(id ?? "");
    const {mutateAsync: updateList} = useUpdateList();
    const {mutateAsync: deleteList, isPending: isDeleting} = useDeleteList();
    const {mutate: removeFromList} = useRemoveFromList();
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isManaging, setIsManaging] = useState(false);
    const posters = useMemo(() => (list?.entries ?? []).map(entryToMediaSummary), [list]);

    if (hasSupabase && !session && !isSessionLoading) {
        return (
            <Screen>
                <BackButton className="self-start"/>
                <AccountRequired description={t("guestDescription")}/>
            </Screen>
        );
    }

    if (!list) {
        return (
            <Screen>
                <BackButton className="self-start"/>
                <EmptyState title={t("notFound")}/>
            </Screen>
        );
    }

    const remove = async () => {
        const isDeleted = await deleteList(list.id).then(() => true, () => false);
        if (isDeleted) {
            setIsConfirmingDelete(false);
            router.back();
        }
    };

    return (
        <Screen>
            <View className="flex-row items-center justify-between">
                <BackButton/>
                <View className="flex-row gap-2">
                    <Pressable onPress={() => setIsEditingDetails(true)} aria-label={t("edit")} className="h-11 w-11 items-center justify-center rounded-full bg-surface">
                        <Pencil size={18} strokeWidth={2} color={foreground}/>
                    </Pressable>
                    <Pressable onPress={() => setIsConfirmingDelete(true)} aria-label={t("delete.title")} className="h-11 w-11 items-center justify-center rounded-full bg-surface">
                        <Trash2 size={18} strokeWidth={2} color={foreground}/>
                    </Pressable>
                </View>
            </View>

            <Reveal variant="rise" className="gap-2">
                <Text className="font-sans-semibold text-xs uppercase tracking-wider text-muted-foreground">{t("count", {count: list.entries.length})}</Text>
                <Text role="heading" aria-level={1} className="font-serif text-[38px] leading-[40px] text-foreground">{list.name}</Text>
                {list.description ? <Text className="font-sans text-[15px] leading-[22px] text-muted-foreground">{list.description}</Text> : null}
            </Reveal>

            {list.entries.length > 0 && (
                <Pressable onPress={() => setIsManaging((value) => !value)} aria-pressed={isManaging} className={cn("self-start rounded-full border px-4 py-2", isManaging ? "border-foreground bg-foreground" : "border-border")}>
                    <Text className={cn("font-sans-medium text-[13px]", isManaging ? "text-background" : "text-foreground")}>{isManaging ? t("manage.done") : t("manage.start")}</Text>
                </Pressable>
            )}

            {posters.length ? (
                <PosterGrid
                    columns={GRID_COLUMNS}
                    items={posters}
                    onPress={(media) => router.push(buildRoute.media(media))}
                    renderFooter={isManaging ? (media) => (
                        <Pressable
                            onPress={() => removeFromList({listId: list.id, key: itemKey(media.media_type, media.id)})}
                            aria-label={t("manage.remove")}
                            className="items-center rounded-lg bg-danger-soft py-1.5"
                        >
                            <Text className="font-sans-medium text-xs text-danger">{t("manage.remove")}</Text>
                        </Pressable>
                    ) : undefined}
                />
            ) : (
                <EmptyState title={t("emptyListTitle")} description={t("emptyList")}/>
            )}

            <ListFormSheet
                isOpen={isEditingDetails}
                onClose={() => setIsEditingDetails(false)}
                title={t("form.editTitle")}
                submitLabel={t("form.save")}
                initial={{name: list.name, description: list.description}}
                onSubmit={(details) => updateList({id: list.id, details}).then(() => true, () => false)}
            />
            <ConfirmSheet
                isOpen={isConfirmingDelete}
                onClose={() => setIsConfirmingDelete(false)}
                title={t("delete.title")}
                description={t("delete.description", {name: list.name})}
                confirmLabel={t("delete.confirm")}
                cancelLabel={t("form.cancel")}
                isBusy={isDeleting}
                onConfirm={() => void remove()}
            />
        </Screen>
    );
};
