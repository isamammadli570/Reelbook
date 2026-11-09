import {useMemo, useRef, useState} from "react";
import {ScrollView, View, type HostInstance} from "react-native";
import {useTranslation} from "react-i18next";
import {Share2} from "lucide-react-native";
import {Button} from "@/components/ui/button";
import {Chip} from "@/components/ui/chip";
import {AccountRequired} from "@/widgets/AccountRequired";
import {BackButton} from "@/widgets/BackButton";
import {EmptyState} from "@/widgets/EmptyState";
import {PageTitle} from "@/widgets/PageTitle";
import {RecapCard} from "@/widgets/RecapCard";
import {Screen} from "@/widgets/Screen";
import {useWatches} from "@/hooks/library";
import {useSession} from "@/hooks/auth/useSession";
import {buildRecap, recapYears} from "@/helpers/recap";
import {hasSupabase} from "@/lib/env";
import {shareView} from "@/lib/shareView";
import {toast} from "@/lib/toast";

/** "Your year in review": pick a year, see the card, send it as a picture. */
export const RecapPage = () => {
    const {t} = useTranslation("stats");
    const {watches} = useWatches();
    const {session, isLoading: isSessionLoading} = useSession();
    const isGuest = hasSupabase && !session && !isSessionLoading;
    const years = useMemo(() => recapYears(watches), [watches]);
    const [chosenYear, setChosenYear] = useState<number | null>(null);
    const year = chosenYear !== null && years.includes(chosenYear) ? chosenYear : years[0];
    const recap = useMemo(() => (year === undefined ? null : buildRecap(watches, year)), [watches, year]);

    const cardRef = useRef<HostInstance>(null);
    const settled = useRef(0);
    const [loadedPosters, setLoadedPosters] = useState(0);
    const [isSharing, setIsSharing] = useState(false);
    const isReady = recap !== null && loadedPosters >= recap.titles.length;

    // Posters load per card: choosing another year starts the count over.
    const chooseYear = (value: number) => {
        settled.current = 0;
        setLoadedPosters(0);
        setChosenYear(value);
    };
    const onPosterSettled = () => {
        settled.current += 1;
        setLoadedPosters(settled.current);
    };

    const share = async () => {
        if (!cardRef.current || !recap) return;
        setIsSharing(true);
        try {
            const result = await shareView(cardRef.current, `reelbook-${recap.year}.png`, t("recap.shareTitle", {year: recap.year}));
            if (result === "downloaded") toast.success(t("recap.downloaded"));
        } catch {
            toast.error(t("recap.shareFailed"));
        } finally {
            setIsSharing(false);
        }
    };

    const renderBody = () => {
        if (isGuest) return <AccountRequired description={t("guestDescription")}/>;
        if (!recap) return <EmptyState title={t("empty.title")} description={t("empty.description")}/>;
        return (
            <>
                {years.length > 1 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5" contentContainerClassName="gap-2 px-5">
                        {years.map((value) => <Chip key={value} label={String(value)} isSelected={value === recap.year} onPress={() => chooseYear(value)}/>)}
                    </ScrollView>
                )}
                {/* Keyed by year so a new card starts with fresh posters instead of reusing the old ones. */}
                <View className="items-center">
                    <RecapCard key={recap.year} ref={cardRef} recap={recap} onPosterSettled={onPosterSettled}/>
                </View>
                <Button variant="brand" icon={Share2} label={t("recap.share")} onPress={() => void share()} isLoading={isSharing || !isReady}/>
            </>
        );
    };

    return (
        <Screen>
            <BackButton className="self-start"/>
            <PageTitle title={t("recap.title")}/>
            {renderBody()}
        </Screen>
    );
};
