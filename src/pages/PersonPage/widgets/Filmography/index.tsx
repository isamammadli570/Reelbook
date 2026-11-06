import {useState} from "react";
import {View} from "react-native";
import {useTranslation} from "react-i18next";
import {Button} from "@/components/ui/button";
import {SegmentedControl} from "@/components/ui/segmented-control";
import {Section} from "@/widgets/Section";
import {CreditRow} from "@/pages/PersonPage/widgets/CreditRow";
import {MEDIA_TYPE, type MediaType} from "@/constants/other";
import type {FilmographyEntry} from "@/helpers/person";

const PAGE_SIZE = 15;

type FilmographyProps = {
    movies: FilmographyEntry[];
    series: FilmographyEntry[];
    index?: number;
};

/** Every movie or series they worked on, newest first, a page at a time. */
export const Filmography = ({movies, series, index}: FilmographyProps) => {
    const {t} = useTranslation(["person", "common"]);
    const [selected, setSelected] = useState<MediaType | null>(null);
    const [visible, setVisible] = useState(PAGE_SIZE);

    if (!movies.length && !series.length) return null;

    // Open on whichever kind they have; most actors start with films, some only ever did TV.
    const mediaType = selected ?? (movies.length ? MEDIA_TYPE.MOVIE : MEDIA_TYPE.TV);
    const entries = mediaType === MEDIA_TYPE.MOVIE ? movies : series;
    const options = [
        {value: MEDIA_TYPE.MOVIE, label: t("tabs.movies", {count: movies.length})},
        {value: MEDIA_TYPE.TV, label: t("tabs.series", {count: series.length})},
    ];

    return (
        <Section title={t("filmography")} index={index}>
            <SegmentedControl
                options={options}
                value={mediaType}
                label={t("filmography")}
                onChange={(value) => {
                    setSelected(value);
                    setVisible(PAGE_SIZE);
                }}
            />
            <View>
                {entries.slice(0, visible).map((entry) => <CreditRow key={entry.credit.id} entry={entry}/>)}
            </View>
            {entries.length > visible && (
                <Button variant="outline" label={t("showMore", {count: entries.length - visible})} onPress={() => setVisible((count) => count + PAGE_SIZE * 2)}/>
            )}
        </Section>
    );
};
