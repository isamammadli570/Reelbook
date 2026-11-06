import {useMemo, useState} from "react";
import {View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {AccountRequired} from "@/widgets/AccountRequired";
import {Screen} from "@/widgets/Screen";
import {FavoritesRow} from "@/pages/ProfilePage/widgets/FavoritesRow";
import {FriendsRow} from "@/pages/ProfilePage/widgets/FriendsRow";
import {ProfileCover} from "@/pages/ProfilePage/widgets/ProfileCover";
import {ProfileMenu} from "@/pages/ProfilePage/widgets/ProfileMenu";
import {RecentRow} from "@/pages/ProfilePage/widgets/RecentRow";
import {ShelfMenu, type ShelfLink} from "@/pages/ProfilePage/widgets/ShelfMenu";
import {WatchStats} from "@/pages/ProfilePage/widgets/WatchStats";
import {useSession} from "@/hooks/auth/useSession";
import {useShelf, useWatches} from "@/hooks/library";
import {useUserLists} from "@/hooks/lists";
import {useGetProfile} from "@/hooks/profile";
import {summarize} from "@/helpers/stats";
import {hasSupabase} from "@/lib/env";
import {buildRoute, ROUTES} from "@/constants/routes";
import {SHELF} from "@/constants/other";
import {EMPTY_PROFILE} from "@/api/profile.api";

/** The user's page: cover and avatar, watch time, four favourites, what they watched last, then everything else by count. */
export const ProfilePage = () => {
    const {t} = useTranslation("profile");
    const {session, isLoading: isSessionLoading} = useSession();
    const isGuest = hasSupabase && !session && !isSessionLoading;
    const {data: profile = EMPTY_PROFILE} = useGetProfile();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const {watches} = useWatches();
    const summary = useMemo(() => summarize(watches), [watches]);
    const {items: favorites} = useShelf(SHELF.FAVORITES);
    const {items: movies} = useShelf(SHELF.MOVIES);
    const {items: series} = useShelf(SHELF.SERIES);
    const {items: watchlist} = useShelf(SHELF.WATCHLIST);
    const {items: reviews} = useShelf(SHELF.REVIEWS);
    const {lists} = useUserLists();

    // A guest has nothing to edit or sign out of, so the ⋮ button goes straight to settings.
    const openMenu = () => (isGuest ? router.push(ROUTES.SETTINGS) : setIsMenuOpen(true));
    const shelfLinks: ShelfLink[] = [
        {key: SHELF.MOVIES, label: t("shelves.movies"), count: movies.length, href: buildRoute.shelf(SHELF.MOVIES)},
        {key: SHELF.SERIES, label: t("shelves.series"), count: series.length, href: buildRoute.shelf(SHELF.SERIES)},
        {key: SHELF.WATCHLIST, label: t("shelves.watchlist"), count: watchlist.length, href: buildRoute.shelf(SHELF.WATCHLIST)},
        {key: SHELF.REVIEWS, label: t("shelves.reviews"), count: reviews.length, href: buildRoute.shelf(SHELF.REVIEWS)},
        {key: "lists", label: t("shelves.lists"), count: lists.length, href: ROUTES.LISTS},
    ];

    return (
        <Screen isEdgeToEdge>
            <ProfileCover profile={profile} onOpenMenu={openMenu}/>

            <View className="gap-8 px-5">
                {isGuest ? (
                    <AccountRequired description={t("guestDescription")}/>
                ) : (
                    <>
                        <WatchStats summary={summary}/>
                        <FriendsRow/>
                        <FavoritesRow index={0} items={favorites}/>
                        <RecentRow index={1} watches={watches}/>
                        <ShelfMenu index={2} links={shelfLinks}/>
                    </>
                )}
            </View>

            <ProfileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}/>
        </Screen>
    );
};
