import {useMemo, useState} from "react";
import {Text, View} from "react-native";
import {router, useLocalSearchParams} from "expo-router";
import {useTranslation} from "react-i18next";
import {Pencil, Trash2} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {PressScale} from "@/components/motion/PressScale";
import {Reveal} from "@/components/motion/Reveal";
import {BackButton} from "@/widgets/BackButton";
import {ConfirmSheet} from "@/widgets/ConfirmSheet";
import {EmptyState} from "@/widgets/EmptyState";
import {ListFormSheet} from "@/widgets/ListFormSheet";
import {ListScreen} from "@/widgets/ListScreen";
import {PosterGrid} from "@/widgets/PosterGrid";
import {ProfileSourceState} from "@/widgets/ProfileSourceState";
import {Screen} from "@/widgets/Screen";
import {useDeleteList, useRemoveFromList, useRestoreToList, useUpdateList} from "@/hooks/lists";
import {useProfileSource} from "@/hooks/social";
import {entryToMediaSummary} from "@/helpers/lists";
import {itemKey} from "@/helpers/library";
import {chunk} from "@/helpers/shelves";
import {ownerEyebrow} from "@/helpers/social";
import {toast} from "@/lib/toast";
import {cn} from "@/lib/utils";
import {buildRoute} from "@/constants/routes";
import type {MediaSummary} from "@/api/media.api";

const GRID_COLUMNS = 3;

const openMedia = (media: MediaSummary) => router.push(buildRoute.media(media));

/**
 * One list: its name and description and its titles three across; on your own, editing, removing titles and
 * deleting it. Someone else's lists open read-only under `/user/[username]`.
 * Only the rows near the screen are drawn, so a long list scrolls as smoothly as a short one.
 */
export const UserListPage = () => {
    const {id} = useLocalSearchParams<{id: string}>();
    const {t} = useTranslation("lists");
    const foreground = String(useCSSVariable("--color-foreground"));
    const source = useProfileSource();
    const {isOwn} = source;
    const list = source.lists.lists[id ?? ""];
    const {mutateAsync: updateList} = useUpdateList();
    const {mutateAsync: deleteList, isPending: isDeleting} = useDeleteList();
    const {mutate: removeFromList} = useRemoveFromList();
    const {mutate: restoreToList} = useRestoreToList();
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isManaging, setIsManaging] = useState(false);
    // Rows of three for a virtual list: a list imported from Letterboxd can hold hundreds of films.
    const rows = useMemo(() => chunk((list?.entries ?? []).map(entryToMediaSummary), GRID_COLUMNS), [list]);

    if (source.status !== "ready") return <ProfileSourceState source={source} guestDescription={t("guestDescription")}/>;

    if (!list) {
        return (
            <Screen>
                <BackButton className="self-start"/>
                <EmptyState title={t("notFound")}/>
            </Screen>
        );
    }

    const removeTitle = (key: string) => {
        const index = list.entries.findIndex((entry) => entry.key === key);
        const entry = list.entries[index];
        if (!entry) return;
        removeFromList({listId: list.id, key}, {
            onSuccess: () => toast.show({
                message: t("toast.removed", {title: entry.title}),
                action: {label: t("toast.undo"), onPress: () => restoreToList({listId: list.id, entry, index})},
            }),
        });
    };

    const remove = async () => {
        const isDeleted = await deleteList(list.id).then(() => true, () => false);
        if (isDeleted) {
            setIsConfirmingDelete(false);
            router.back();
        }
    };

    const renderFooter = isManaging ? (media: MediaSummary) => (
        <PressScale
            scaleTo={0.98}
            onPress={() => removeTitle(itemKey(media.media_type, media.id))}
            aria-label={t("manage.remove")}
            className="items-center rounded-lg bg-danger-soft py-1.5"
        >
            <Text className="font-sans-medium text-xs text-danger">{t("manage.remove")}</Text>
        </PressScale>
    ) : undefined;

    const header = (
        <>
            <View className="flex-row items-center justify-between">
                <BackButton/>
                {isOwn && <View className="flex-row gap-2">
                    <PressScale scaleTo={0.98} onPress={() => setIsEditingDetails(true)} aria-label={t("edit")} className="h-11 w-11 items-center justify-center rounded-full bg-surface">
                        <Pencil size={18} strokeWidth={2} color={foreground}/>
                    </PressScale>
                    <PressScale scaleTo={0.98} onPress={() => setIsConfirmingDelete(true)} aria-label={t("delete.title")} className="h-11 w-11 items-center justify-center rounded-full bg-surface">
                        <Trash2 size={18} strokeWidth={2} color={foreground}/>
                    </PressScale>
                </View>}
            </View>

            <Reveal variant="rise" className="gap-2">
                <Text className="font-sans-semibold text-xs uppercase tracking-wider text-muted-foreground">{ownerEyebrow(source.username, isOwn, t("count", {count: list.entries.length}))}</Text>
                <Text role="heading" aria-level={1} className="font-serif text-[38px] leading-[40px] text-foreground">{list.name}</Text>
                {list.description ? <Text className="font-sans text-[15px] leading-[22px] text-muted-foreground">{list.description}</Text> : null}
            </Reveal>

            {isOwn && list.entries.length > 0 && (
                <PressScale scaleTo={0.98} onPress={() => setIsManaging((value) => !value)} aria-pressed={isManaging} className={cn("self-start rounded-full border px-4 py-2", isManaging ? "border-foreground bg-foreground" : "border-border")}>
                    <Text className={cn("font-sans-medium text-[13px]", isManaging ? "text-background" : "text-foreground")}>{isManaging ? t("manage.done") : t("manage.start")}</Text>
                </PressScale>
            )}
        </>
    );

    return (
        <ListScreen
            header={header}
            rows={rows}
            extraData={isManaging}
            rowKey={(row) => row.map((media) => `${media.media_type}:${media.id}`).join(",")}
            empty={<EmptyState title={t("emptyListTitle")} description={isOwn ? t("emptyList") : undefined}/>}
            renderRow={(row) => (
                <PosterGrid columns={GRID_COLUMNS} items={row} onPress={openMedia} renderFooter={renderFooter}/>
            )}
        >
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
        </ListScreen>
    );
};
