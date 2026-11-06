import {useState} from "react";
import {Pressable, ScrollView, Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {Check, Plus} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {BottomSheet} from "@/widgets/BottomSheet";
import {ListFormSheet} from "@/widgets/ListFormSheet";
import {useCreateList, useListIdsContaining, useToggleInList, useUserLists} from "@/hooks/lists";
import {itemKey} from "@/helpers/library";
import {createListId} from "@/helpers/lists";
import {haptics} from "@/lib/haptics";
import {cn} from "@/lib/utils";
import type {MediaSnapshot} from "@/api/library.api";

type AddToListSheetProps = {
    snapshot: MediaSnapshot;
    isOpen: boolean;
    onClose: () => void;
};

/** Ticks the lists a title belongs to; a tap adds or removes it, and a new list can be made on the spot. */
export const AddToListSheet = ({snapshot, isOpen, onClose}: AddToListSheetProps) => {
    const {t} = useTranslation("lists");
    const [brandInk, muted] = useCSSVariable(["--color-brand-ink", "--color-muted-foreground"]).map(String);
    const {lists} = useUserLists();
    const containing = useListIdsContaining(itemKey(snapshot.mediaType, snapshot.id));
    const {mutate: toggle, mutateAsync: toggleAsync} = useToggleInList();
    const {mutateAsync: createList} = useCreateList();
    const [isCreating, setIsCreating] = useState(false);

    // A list made from here already holds the title the user was looking at.
    const createAndAdd = async (details: {name: string; description: string}) => {
        const id = createListId();
        try {
            await createList({id, details});
            await toggleAsync({listId: id, snapshot});
            haptics.success();
            return true;
        } catch {
            return false;
        }
    };

    return (
        <>
            <BottomSheet isOpen={isOpen && !isCreating} onClose={onClose} title={t("addTo.title")}>
                <Text className="font-sans text-sm text-muted-foreground" numberOfLines={1}>{snapshot.title}</Text>
                <ScrollView className="-mx-1" contentContainerClassName="gap-1 px-1">
                    <Pressable onPress={() => setIsCreating(true)} className="flex-row items-center gap-3 rounded-xl px-3 py-3 active:bg-surface-raised">
                        <View className="h-9 w-9 items-center justify-center rounded-lg border border-dashed border-border">
                            <Plus size={18} strokeWidth={2} color={muted}/>
                        </View>
                        <Text className="font-sans-medium text-[15px] text-foreground">{t("addTo.newList")}</Text>
                    </Pressable>
                    {lists.map((list) => {
                        const isListed = containing.has(list.id);
                        return (
                            <Pressable
                                key={list.id}
                                role="checkbox"
                                aria-checked={isListed}
                                onPress={() => {
                                    haptics.tap();
                                    toggle({listId: list.id, snapshot});
                                }}
                                className="flex-row items-center gap-3 rounded-xl px-3 py-3 active:bg-surface-raised"
                            >
                                <View className={cn("h-9 w-9 items-center justify-center rounded-lg", isListed ? "bg-brand" : "bg-surface-raised")}>
                                    {isListed && <Check size={18} strokeWidth={3} color={brandInk}/>}
                                </View>
                                <View className="min-w-0 flex-1">
                                    <Text className="font-sans-medium text-[15px] text-foreground" numberOfLines={1}>{list.name}</Text>
                                    <Text className="font-sans text-xs text-muted-foreground">{t("count", {count: list.entries.length})}</Text>
                                </View>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </BottomSheet>
            <ListFormSheet
                isOpen={isOpen && isCreating}
                onClose={() => setIsCreating(false)}
                title={t("form.createTitle")}
                submitLabel={t("form.create")}
                onSubmit={createAndAdd}
            />
        </>
    );
};
