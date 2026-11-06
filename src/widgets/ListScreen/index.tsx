import type {ReactElement, ReactNode} from "react";
import {FlatList, Platform, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {useCSSVariable} from "uniwind";
import {EntranceContext} from "@/components/motion/EntranceContext";
import {MAX_CONTENT_WIDTH} from "@/constants/other";
import {TAB_BAR_HEIGHT, TAB_BAR_OFFSET} from "@/layout/TabBar";

/** Space between a page's header blocks and between rows, matching `Screen`'s gap. */
const ROW_GAP = 16;
/** Rows that rise in when the page opens; later ones are mounted while scrolling and simply appear. */
const ANIMATED_ROWS = 6;

type ListScreenProps<T> = {
    /** Back button, title and anything else above the rows; scrolls with them. */
    header: ReactNode;
    rows: T[];
    rowKey: (row: T) => string;
    renderRow: (row: T) => ReactElement;
    /** Shown instead of rows when there are none (an empty state, or "sign in"). */
    empty?: ReactNode;
    /** Space between rows; rows that space themselves pass 0. */
    rowGap?: number;
    /** Content laid over the list, such as a sort menu. */
    children?: ReactNode;
    /** Anything else rows are drawn from (a mode, a lookup): rows redraw when it changes, not only when `rows` do. */
    extraData?: unknown;
    /** Near the end of the rows: load the next page. */
    onEndReached?: () => void;
    /** Shown under the last row, such as a spinner while the next page loads. */
    footer?: ReactElement | null;
};

/**
 * `Screen`'s layout for pages that can grow long, such as the diary or a shelf of hundreds of titles.
 * A FlatList keeps only the rows near the screen mounted, so a long history scrolls as smoothly as a short one.
 */
export const ListScreen = <T,>({header, rows, rowKey, renderRow, empty, rowGap = ROW_GAP, children, extraData, onEndReached, footer}: ListScreenProps<T>) => {
    const insets = useSafeAreaInsets();
    const background = String(useCSSVariable("--color-background"));

    return (
        <View className="flex-1" style={{backgroundColor: background}}>
            <FlatList
                data={rows}
                extraData={extraData}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.5}
                ListFooterComponent={footer ?? undefined}
                keyExtractor={rowKey}
                renderItem={({item, index}) => (
                    <EntranceContext.Provider value={index < ANIMATED_ROWS}>
                        <View style={index > 0 ? {marginTop: rowGap} : undefined}>{renderRow(item)}</View>
                    </EntranceContext.Provider>
                )}
                ListHeaderComponent={<View style={{gap: ROW_GAP * 1.5, paddingBottom: ROW_GAP * 1.5}}>{header}</View>}
                ListEmptyComponent={empty ? <View>{empty}</View> : undefined}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={{
                    width: "100%",
                    maxWidth: MAX_CONTENT_WIDTH,
                    alignSelf: "center",
                    paddingHorizontal: 20,
                    paddingTop: insets.top + 16,
                    paddingBottom: insets.bottom + TAB_BAR_HEIGHT + TAB_BAR_OFFSET + 24,
                }}
                initialNumToRender={8}
                maxToRenderPerBatch={8}
                windowSize={7}
                // Unmounting far-off rows saves memory on Android; iOS and the web handle long lists without it.
                removeClippedSubviews={Platform.OS === "android"}
            />
            {children}
        </View>
    );
};
