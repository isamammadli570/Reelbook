import {useEffect, useMemo, useState} from "react";
import {ActivityIndicator, Text, View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {EllipsisVertical, Share2} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {Reveal} from "@/components/motion/Reveal";
import {AccountRequired} from "@/widgets/AccountRequired";
import {BackButton} from "@/widgets/BackButton";
import {EmptyState} from "@/widgets/EmptyState";
import {FollowButton} from "@/widgets/FollowButton";
import {QueryErrorState} from "@/widgets/QueryErrorState";
import {Screen} from "@/widgets/Screen";
import {FavoritesRow} from "@/pages/ProfilePage/widgets/FavoritesRow";
import {FriendsRow} from "@/pages/ProfilePage/widgets/FriendsRow";
import {CoverButton, ProfileCover} from "@/pages/ProfilePage/widgets/ProfileCover";
import {ProfileMenu} from "@/pages/ProfilePage/widgets/ProfileMenu";
import {PublicProfileNotice} from "@/pages/ProfilePage/widgets/PublicProfileNotice";
import {RecentRow} from "@/pages/ProfilePage/widgets/RecentRow";
import {ShelfMenu, type ShelfLink} from "@/pages/ProfilePage/widgets/ShelfMenu";
import {WatchStats} from "@/pages/ProfilePage/widgets/WatchStats";
import {useFollowCounts, useProfileSource} from "@/hooks/social";
import {useGetProfile} from "@/hooks/profile";
import {useShareProfile} from "@/hooks/profile/useShareProfile";
import {summarize, collectWatches} from "@/helpers/stats";
import {sortedLists} from "@/helpers/lists";
import {DEFAULT_SHELF_SORT, shelfItems, sortShelf} from "@/helpers/shelves";
import {ROUTES} from "@/constants/routes";
import {SHELF} from "@/constants/other";
import {EMPTY_PROFILE} from "@/api/profile.api";

/** The shelves listed under the rows, each with its count. */
const SHELF_LINKS = [SHELF.MOVIES, SHELF.SERIES, SHELF.WATCHLIST, SHELF.REVIEWS] as const;

/**
 * A profile: cover and avatar, watch time, four favourites, what was watched last, then everything else by
 * count. Your own on the profile tab, read from the device and editable; anyone's under `/user/[username]`,
 * read from the server, with a follow button, and the same rows and pages as your own.
 */
export const ProfilePage = () => {
    const {t} = useTranslation("profile");
    const {t: tSocial} = useTranslation("social");
    const muted = String(useCSSVariable("--color-muted-foreground"));
    const source = useProfileSource();
    const {isOwn, user, library, routes} = source;
    const {data: ownProfile = EMPTY_PROFILE} = useGetProfile();
    const counts = useFollowCounts(isOwn ? null : user?.userId);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const share = useShareProfile();

    // Your own @username opens your own profile tab, with editing and the menu.
    useEffect(() => {
        if (source.username && isOwn && user) router.replace(ROUTES.PROFILE);
    }, [source.username, isOwn, user]);

    const watches = useMemo(() => collectWatches(library), [library]);
    const summary = useMemo(() => summarize(watches), [watches]);
    const favorites = useMemo(() => sortShelf(shelfItems(library, SHELF.FAVORITES), DEFAULT_SHELF_SORT[SHELF.FAVORITES]), [library]);
    const lists = useMemo(() => sortedLists(source.lists), [source.lists]);
    // Counted once per library rather than on every render: each count walks the whole library.
    const shelfCounts = useMemo(
        () => Object.fromEntries(SHELF_LINKS.map((kind) => [kind, shelfItems(library, kind).length])) as Record<(typeof SHELF_LINKS)[number], number>,
        [library],
    );

    const coverProfile = isOwn ? ownProfile : user;
    const username = isOwn ? ownProfile.username : user?.username ?? "";
    const isGuest = source.status === "guest";
    const canShare = Boolean(username) && !isGuest;
    const shareButton = canShare ? <CoverButton icon={Share2} label={t("menu.share")} onPress={() => share(username)}/> : null;

    if (!coverProfile) {
        // Someone else's profile before it arrives, or nobody by that name: there is no cover to draw yet.
        const body = source.status === "loading"
            ? <ActivityIndicator color={muted}/>
            : source.status === "error"
                ? <QueryErrorState error={source.error} onRetry={source.retry}/>
                : <EmptyState title={tSocial("user.notFound")} description={tSocial("user.notFoundHint", {username: source.username ?? ""})}/>;
        return (
            <Screen>
                <BackButton className="self-start"/>
                {body}
            </Screen>
        );
    }

    const shelfLinks: ShelfLink[] = SHELF_LINKS.map((kind) => ({
        key: kind,
        label: t(`shelves.${kind}`),
        count: shelfCounts[kind],
        href: routes.shelf(kind),
    }));
    shelfLinks.push({key: "lists", label: t("shelves.lists"), count: lists.length, href: routes.lists});

    const renderBody = () => {
        if (isGuest) return <AccountRequired description={t("guestDescription")}/>;
        if (source.status === "hidden") return <EmptyState title={tSocial("user.hidden")} description={tSocial("user.hiddenHint", {username})}/>;
        if (source.status === "error") return <QueryErrorState error={source.error} onRetry={source.retry}/>;
        if (source.status === "loading") return <ActivityIndicator color={muted}/>;
        return (
            <>
                {isOwn && !ownProfile.shareActivity && <PublicProfileNotice/>}
                <WatchStats summary={summary}/>
                {isOwn && <FriendsRow/>}
                {(isOwn || favorites.length > 0) && <FavoritesRow index={0} items={favorites} routes={routes} isOwn={isOwn}/>}
                <RecentRow index={1} watches={watches} diaryHref={routes.diary} emptyText={isOwn ? t("recent.empty") : t("others.empty")}/>
                <ShelfMenu index={2} links={shelfLinks}/>
            </>
        );
    };

    return (
        <Screen isEdgeToEdge>
            <ProfileCover
                profile={coverProfile}
                leading={isOwn ? null : <BackButton/>}
                actions={isOwn
                    ? (
                        <>
                            {shareButton}
                            {/* A guest has nothing to edit or sign out of, so ⋮ goes straight to settings. */}
                            <CoverButton icon={EllipsisVertical} label={t("menu.open")} onPress={() => (isGuest ? router.push(ROUTES.SETTINGS) : setIsMenuOpen(true))}/>
                        </>
                    )
                    : shareButton}
            >
                {!isOwn && user && (
                    <Reveal variant="rise" index={3} className="gap-3">
                        <Text className="font-sans text-[13px] text-muted-foreground">
                            {`${tSocial("counts.followers", {count: counts.data?.followers ?? 0})}  ·  ${tSocial("counts.following", {count: counts.data?.following ?? 0})}`}
                        </Text>
                        <FollowButton userId={user.userId} className="self-start min-w-[160px]"/>
                    </Reveal>
                )}
            </ProfileCover>

            <View className="gap-8 px-5">{renderBody()}</View>

            {isOwn && <ProfileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}/>}
        </Screen>
    );
};
