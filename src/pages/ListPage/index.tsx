import {useMemo, useState} from "react";
import {Pressable, View} from "react-native";
import {router, useLocalSearchParams} from "expo-router";
import {useTranslation} from "react-i18next";
import {ArrowDownWideNarrow} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {BackButton} from "@/widgets/BackButton";
import {EmptyState} from "@/widgets/EmptyState";
import {PageTitle} from "@/widgets/PageTitle";
import {PosterGrid} from "@/widgets/PosterGrid";
import {ReviewList} from "@/widgets/ReviewList";
import {Screen} from "@/widgets/Screen";
import {Section} from "@/widgets/Section";
import {SeriesProgressLine} from "@/widgets/SeriesProgressLine";
import {SortMenu} from "@/pages/ListPage/widgets/SortMenu";
import {useShelf} from "@/hooks/library";
import {useSession} from "@/hooks/auth/useSession";
import {hasSupabase} from "@/lib/env";
import {AccountRequired} from "@/widgets/AccountRequired";
import {toMediaSummary} from "@/helpers/library";
import {DEFAULT_SHELF_SORT, groupByStatus} from "@/helpers/shelves";
import {buildRoute} from "@/constants/routes";
import {SHELF, type Shelf, type ShelfSort} from "@/constants/other";
import type {LibraryItem} from "@/api/library.api";

const GRID_COLUMNS = 3;

const isShelf = (value: string | undefined): value is Shelf => Object.values(SHELF).includes(value as Shelf);

/** Every title of one profile row, three across, with a sort menu; series can be grouped by watch status. */
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
    const byKey = useMemo(() => new Map(items.map((item) => [`${item.mediaType}-${item.id}`, item])), [items]);

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

    const grid = (list: LibraryItem[]) => (
        <PosterGrid
            columns={GRID_COLUMNS}
            items={list.map(toMediaSummary)}
            onPress={(media) => router.push(buildRoute.media(media))}
            renderFooter={isSeries ? (media) => {
                const item = byKey.get(`${media.media_type}-${media.id}`);
                return item ? <SeriesProgressLine item={item}/> : null;
            } : undefined}
        />
    );

    const renderBody = () => {
        if (!items.length) return <EmptyState title={t(`empty.${shelf}`)}/>;
        if (isReviews) return <ReviewList items={items}/>;
        if (isSeries && isGrouped) {
            return groupByStatus(items).map((group, index) => (
                <Section key={group.status} index={index} title={t(`status.${group.status}`)}>{grid(group.items)}</Section>
            ));
        }
        return grid(items);
    };

    return (
        <Screen>
            <View className="flex-row items-center justify-between">
                <BackButton/>
                {!isReviews && items.length > 1 && (
                    <Pressable onPress={() => setIsSortOpen(true)} aria-label={t("list.sort")} className="h-11 w-11 items-center justify-center rounded-full bg-surface">
                        <ArrowDownWideNarrow size={20} strokeWidth={2} color={foreground}/>
                    </Pressable>
                )}
            </View>
            <PageTitle title={t(`shelves.${shelf}`)} eyebrow={t("list.count", {count: items.length})}/>
            {renderBody()}
            <SortMenu
                isOpen={isSortOpen}
                onClose={() => setIsSortOpen(false)}
                sort={sort}
                onSortChange={setSort}
                canGroup={isSeries}
                isGrouped={isGrouped}
                onGroupedChange={setIsGrouped}
            />
        </Screen>
    );
};
