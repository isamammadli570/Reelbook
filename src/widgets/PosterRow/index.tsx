import {useMemo, type ReactNode} from "react";
import {Pressable, Text, View} from "react-native";
import {router} from "expo-router";
import {ChevronRight} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {Reveal} from "@/components/motion/Reveal";
import {PosterGrid} from "@/widgets/PosterGrid";
import {toMediaSummary} from "@/helpers/library";
import {buildRoute} from "@/constants/routes";
import {SHELF_PREVIEW} from "@/constants/other";
import type {LibraryItem} from "@/api/library.api";

type PosterRowProps = {
    title: string;
    items: LibraryItem[];
    emptyText: string;
    /** Opens the full list; the header shows the count and a chevron when there is anything to see. */
    onSeeAll: () => void;
    renderFooter?: (item: LibraryItem) => ReactNode;
    index?: number;
};

/** A profile row: title with count and "see all", then the first four posters across the width. */
export const PosterRow = ({title, items, emptyText, onSeeAll, renderFooter, index = 0}: PosterRowProps) => {
    const muted = String(useCSSVariable("--color-muted-foreground"));
    const preview = useMemo(() => items.slice(0, SHELF_PREVIEW), [items]);
    const posters = useMemo(() => preview.map(toMediaSummary), [preview]);
    const byKey = useMemo(() => new Map(preview.map((item) => [`${item.mediaType}-${item.id}`, item])), [preview]);

    return (
        <Reveal index={index} variant="rise" className="gap-3">
            <Pressable onPress={onSeeAll} disabled={!items.length} className="flex-row items-center justify-between" aria-label={title}>
                <Text role="heading" className="font-serif text-[26px] text-foreground">{title}</Text>
                {items.length > 0 && (
                    <View className="flex-row items-center gap-1">
                        <Text className="font-sans-medium text-[15px] text-muted-foreground">{items.length}</Text>
                        <ChevronRight size={20} strokeWidth={2} color={muted}/>
                    </View>
                )}
            </Pressable>
            {posters.length
                ? (
                    <PosterGrid
                        items={posters}
                        onPress={(media) => router.push(buildRoute.media(media))}
                        renderFooter={renderFooter ? (media) => {
                            const item = byKey.get(`${media.media_type}-${media.id}`);
                            return item ? renderFooter(item) : null;
                        } : undefined}
                    />
                )
                : <Text className="font-sans text-sm leading-5 text-muted-foreground">{emptyText}</Text>}
        </Reveal>
    );
};
