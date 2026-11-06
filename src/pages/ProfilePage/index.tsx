import {useMemo, useState} from "react";
import {View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {AccountRequired} from "@/widgets/AccountRequired";
import {PosterRow} from "@/widgets/PosterRow";
import {Screen} from "@/widgets/Screen";
import {SeriesProgressLine} from "@/widgets/SeriesProgressLine";
import {ProfileCover} from "@/pages/ProfilePage/widgets/ProfileCover";
import {ProfileMenu} from "@/pages/ProfilePage/widgets/ProfileMenu";
import {WatchStats} from "@/pages/ProfilePage/widgets/WatchStats";
import {ListsRow} from "@/pages/ProfilePage/widgets/ListsRow";
import {useSession} from "@/hooks/auth/useSession";
import {useShelf, useWatches} from "@/hooks/library";
import {useGetProfile} from "@/hooks/profile";
import {summarize} from "@/helpers/stats";
import {hasSupabase} from "@/lib/env";
import {buildRoute, ROUTES} from "@/constants/routes";
import {SHELF, type Shelf} from "@/constants/other";
import {EMPTY_PROFILE} from "@/api/profile.api";

/** The user's page: cover and avatar, watch time, then favourites, movies, series, watchlist and reviews as rows. */
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

    const fallbackCoverPath = [...favorites, ...movies, ...series].find((item) => item.backdropPath)?.backdropPath ?? null;
    // A guest has nothing to edit or sign out of, so the ⋮ button goes straight to settings.
    const openMenu = () => (isGuest ? router.push(ROUTES.SETTINGS) : setIsMenuOpen(true));
    const seeAll = (shelf: Shelf) => () => router.push(buildRoute.shelf(shelf));

    return (
        <Screen isEdgeToEdge>
            <ProfileCover profile={profile} fallbackCoverPath={fallbackCoverPath} onOpenMenu={openMenu}/>

            <View className="gap-8 px-5">
                {isGuest ? (
                    <AccountRequired description={t("guestDescription")}/>
                ) : (
                    <>
                        <WatchStats summary={summary}/>
                        <PosterRow index={0} title={t("shelves.favorites")} items={favorites} emptyText={t("empty.favorites")} onSeeAll={seeAll(SHELF.FAVORITES)}/>
                        <PosterRow index={1} title={t("shelves.movies")} items={movies} emptyText={t("empty.movies")} onSeeAll={seeAll(SHELF.MOVIES)}/>
                        <PosterRow
                            index={2}
                            title={t("shelves.series")}
                            items={series}
                            emptyText={t("empty.series")}
                            onSeeAll={seeAll(SHELF.SERIES)}
                            renderFooter={(item) => <SeriesProgressLine item={item}/>}
                        />
                        <PosterRow index={3} title={t("shelves.watchlist")} items={watchlist} emptyText={t("empty.watchlist")} onSeeAll={seeAll(SHELF.WATCHLIST)}/>
                        <ListsRow index={4}/>
                        <PosterRow index={5} title={t("shelves.reviews")} items={reviews} emptyText={t("empty.reviews")} onSeeAll={seeAll(SHELF.REVIEWS)}/>
                    </>
                )}
            </View>

            <ProfileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}/>
        </Screen>
    );
};
