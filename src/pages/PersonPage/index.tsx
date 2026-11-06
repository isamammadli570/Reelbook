import {useMemo} from "react";
import {router, useLocalSearchParams} from "expo-router";
import {useTranslation} from "react-i18next";
import {DetailErrorState} from "@/widgets/DetailErrorState";
import {DetailHero} from "@/widgets/DetailHero";
import {DetailBody, DetailScreen} from "@/widgets/DetailScreen";
import {DetailSkeleton} from "@/widgets/DetailSkeleton";
import {ExpandableText} from "@/widgets/ExpandableText";
import {PosterGrid} from "@/widgets/PosterGrid";
import {Section} from "@/widgets/Section";
import {StatStrip} from "@/widgets/StatStrip";
import {Filmography} from "@/pages/PersonPage/widgets/Filmography";
import {PersonFacts, type Fact} from "@/pages/PersonPage/widgets/PersonFacts";
import {useGetPerson} from "@/hooks/details";
import {useDateFormat} from "@/hooks/useDateFormat";
import {useDepartmentLabel} from "@/hooks/useDepartmentLabel";
import {careerCredits, creditToMediaSummary, filmography, knownFor, personAge} from "@/helpers/person";
import {buildRoute} from "@/constants/routes";
import {MEDIA_TYPE} from "@/constants/other";

/** A person: portrait over a still from their best-known title, their life in brief, and everything they made. */
export const PersonPage = () => {
    const {id} = useLocalSearchParams<{id: string}>();
    const {t} = useTranslation("person");
    const dates = useDateFormat();
    const departmentLabel = useDepartmentLabel();
    const personId = Number(id);
    const {data: person, isLoading, isError, error, refetch} = useGetPerson(personId);

    const career = useMemo(() => {
        if (!person) return null;
        const credits = careerCredits(person);
        return {
            famous: knownFor(person),
            movies: filmography(credits, MEDIA_TYPE.MOVIE),
            series: filmography(credits, MEDIA_TYPE.TV),
        };
    }, [person]);

    if (isLoading) return <DetailSkeleton/>;
    if (isError || !person || !career) return <DetailErrorState error={error} onRetry={() => void refetch()}/>;

    const age = personAge(person.birthday, person.deathday);
    const born = dates.longDate(person.birthday);
    const died = dates.longDate(person.deathday);
    const facts: Fact[] = [
        born ? {label: t("born"), value: born} : null,
        person.place_of_birth ? {label: t("birthplace"), value: person.place_of_birth} : null,
        died ? {label: t("died"), value: died} : null,
    ].filter((fact) => fact !== null);

    const stats = [
        {value: age === null ? "—" : String(age), label: person.deathday ? t("stats.lifespan") : t("stats.age")},
        {value: String(career.movies.length), label: t("stats.movies")},
        {value: String(career.series.length), label: t("stats.series")},
    ];

    return (
        <DetailScreen>
            <DetailHero
                title={person.name}
                backdropPath={career.famous.find((credit) => credit.backdrop_path)?.backdrop_path ?? null}
                posterPath={person.profile_path}
                eyebrow={departmentLabel(person.known_for_department)}
            />
            <DetailBody>
                <StatStrip stats={stats}/>
                <PersonFacts facts={facts}/>
                {person.biography ? (
                    <Section title={t("biography")}>
                        <ExpandableText text={person.biography}/>
                    </Section>
                ) : null}
                {career.famous.length > 0 && (
                    <Section title={t("knownFor")} index={1}>
                        <PosterGrid items={career.famous.map(creditToMediaSummary)} onPress={(media) => router.push(buildRoute.media(media))}/>
                    </Section>
                )}
                <Filmography movies={career.movies} series={career.series} index={2}/>
            </DetailBody>
        </DetailScreen>
    );
};
