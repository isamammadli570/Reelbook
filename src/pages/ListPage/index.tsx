import {useMemo, useState} from "react";
import {Text, View} from "react-native";
import {router, useLocalSearchParams} from "expo-router";
import {useTranslation} from "react-i18next";
import {ArrowDownWideNarrow} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {PressScale} from "@/components/motion/PressScale";
import {Reveal} from "@/components/motion/Reveal";
import {BackButton} from "@/widgets/BackButton";
import {EmptyState} from "@/widgets/EmptyState";
import {ListScreen} from "@/widgets/ListScreen";
import {PageTitle} from "@/widgets/PageTitle";
import {PosterGrid} from "@/widgets/PosterGrid";
import {ReviewList} from "@/widgets/ReviewList";
import {Screen} from "@/widgets/Screen";
import {ShelfFooter} from "@/widgets/ShelfFooter";
import {SortMenu} from "@/pages/ListPage/widgets/SortMenu";
import {useShelf} from "@/hooks/library";
import {useSession} from "@/hooks/auth/useSession";
import {hasSupabase} from "@/lib/env";
import {AccountRequired} from "@/widgets/AccountRequired";
import {toMediaSummary} from "@/helpers/library";
import {DEFAULT_SHELF_SORT, shelfRows, shelfSorts} from "@/helpers/shelves";
import {buildRoute} from "@/constants/routes";
import {SHELF, type Shelf, type ShelfSort} from "@/constants/other";

const GRID_COLUMNS = 3;

const isShelf = (value: string | undefined): value is Shelf => Object.values(SHELF).includes(value as Shelf);

/**
 * Every title of one profile row, three across, with a sort menu; series can be grouped by watch status.
 * The grid is a virtual list, so only the rows on screen are drawn however long the shelf grows.
 */
export const ListPage = () => {
    const {kind} = useLocalSearchParams<{kind: string}>();
    const shelf: Shelf = isShelf(kind) ? kind : SHELF.FAVORITES;
    const {t} = useTranslation("profile");
    const foreground = String(useCSSVariable("--color-foreground"));
    const [sort, setSort] = useState<ShelfSort>(DEFAULT_SHELF_SORT[shelf]);
    const [isGrouped, setIsGrouped] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const {items} = useShelf(shelf, sort);
    const {session, isLoading: isSessionLoading} = useSession();
    const isGuest = hasSupabase && !session && !isSessionLoading;

    const isSeries = shelf === SHELF.SERIES;
    const isReviews = shelf === SHELF.REVIEWS;
    const isWatchlist = shelf === SHELF.WATCHLIST;
    const byKey = useMemo(() => new Map(items.map((item) => [`${item.mediaType}-${item.id}`, item])), [items]);
    const rows = useMemo(() => shelfRows(items, GRID_COLUMNS, isSeries && isGrouped), [items, isSeries, isGrouped]);

    if (isGuest) {
        return (
            <Screen>
                <BackButton className="self-start"/>
                <AccountRequired description={t("guestDescription")}/>
            </Screen>
        );
    }

    if (!isShelf(kind)) {
        return (
            <Screen>
                <BackButton className="self-start"/>
                <EmptyState title={t("list.notFound")}/>
            </Screen>
        );
    }

    const header = (
        <>
            <View className="flex-row items-center justify-between">
                <BackButton/>
                {!isReviews && items.length > 1 && (
                    <PressScale onPress={() => setIsSortOpen(true)} aria-label={t("list.sort")} className="h-11 w-11 items-center justify-center rounded-full bg-surface">
                        <ArrowDownWideNarrow size={20} strokeWidth={2} color={foreground}/>
                    </PressScale>
                )}
            </View>
            <PageTitle title={t(`shelves.${shelf}`)} eyebrow={t("list.count", {count: items.length})}/>
        </>
    );

    // Reviews are a short list of text cards; everything else is a poster grid that can run to hundreds.
    if (isReviews) {
        return (
            <Screen>
                {header}
                {items.length ? <ReviewList items={items}/> : <EmptyState title={t("empty.reviews")}/>}
            </Screen>
        );
    }

    return (
        <ListScreen
            header={header}
            rows={rows}
            rowKey={(row) => row.key}
            empty={<EmptyState title={t(`empty.${shelf}`)}/>}
            renderRow={(row) => row.kind === "title"
                ? (
                    <Reveal variant="fade" className="pt-2">
                        <Text role="heading" className="font-serif text-[26px] text-foreground">{t(`status.${row.status}`)}</Text>
                    </Reveal>
                )
                : (
                    <PosterGrid
                        columns={GRID_COLUMNS}
                        items={row.items.map(toMediaSummary)}
                        onPress={(media) => router.push(buildRoute.media(media))}
                        // The watchlist is unwatched and mixes movies with series, so it keeps the plain "type · year" line.
                        renderFooter={isWatchlist ? undefined : (media) => {
                            const item = byKey.get(`${media.media_type}-${media.id}`);
                            return item ? <ShelfFooter item={item}/> : null;
                        }}
                    />
                )}
        >
            <SortMenu
                isOpen={isSortOpen}
                onClose={() => setIsSortOpen(false)}
                sorts={shelfSorts(shelf)}
                sort={sort}
                onSortChange={setSort}
                canGroup={isSeries}
                isGrouped={isGrouped}
                onGroupedChange={setIsGrouped}
            />
        </ListScreen>
    );
};
