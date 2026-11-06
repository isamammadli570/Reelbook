import {useTranslation} from "react-i18next";
import {CastRow} from "@/widgets/CastRow";
import {Section} from "@/widgets/Section";
import type {PersonCount} from "@/helpers/stats";

type TopPeopleProps = {
    title: string;
    people: PersonCount[];
    /** "films" for directors, "titles" for actors, who also appear in series. */
    unit: "films" | "titles";
    index?: number;
};

/** The people behind most of what was watched, as round portraits that open their pages. */
export const TopPeople = ({title, people, unit, index}: TopPeopleProps) => {
    const {t} = useTranslation("stats");
    if (!people.length) return null;

    const chips = people.map(({person, titles}) => ({
        id: person.id,
        name: person.name,
        profile_path: person.profilePath,
        character: t(`people.${unit}`, {count: titles}),
    }));
    return (
        <Section title={title} index={index}>
            <CastRow cast={chips}/>
        </Section>
    );
};
