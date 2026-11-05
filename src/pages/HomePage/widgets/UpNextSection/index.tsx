import {ScrollView} from "react-native";
import {useTranslation} from "react-i18next";
import {Section} from "@/widgets/Section";
import {ContinueCard} from "@/pages/HomePage/widgets/ContinueCard";
import {UpNextHero} from "@/pages/HomePage/widgets/UpNextHero";
import {useUpNext} from "@/hooks/library";

/** The series in progress: the latest one as a big card, the rest in a scrolling row. Hidden until there is any. */
export const UpNextSection = () => {
    const {t} = useTranslation("home");
    const {items} = useUpNext();
    const [first, ...rest] = items;

    if (!first) return null;

    return (
        <>
            <UpNextHero item={first.item} next={first.next}/>
            {rest.length > 0 && (
                <Section title={t("upNext.continue")}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5" contentContainerClassName="gap-2.5 px-5">
                        {rest.map(({item, next}) => <ContinueCard key={item.id} item={item} next={next}/>)}
                    </ScrollView>
                </Section>
            )}
        </>
    );
};
