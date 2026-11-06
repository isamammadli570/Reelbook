import {useState} from "react";
import {Text, View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {CircleCheck, FileUp} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {Reveal} from "@/components/motion/Reveal";
import {Button} from "@/components/ui/button";
import {BackButton} from "@/widgets/BackButton";
import {EmptyState} from "@/widgets/EmptyState";
import {PageTitle} from "@/widgets/PageTitle";
import {ProgressBar} from "@/widgets/ProgressBar";
import {Screen} from "@/widgets/Screen";
import {Section} from "@/widgets/Section";
import {StatStrip} from "@/widgets/StatStrip";
import {useLetterboxdImport, type ImportSummary} from "@/hooks/library";
import {haptics} from "@/lib/haptics";
import {toast} from "@/lib/toast";
import {ROUTES} from "@/constants/routes";
import type {LetterboxdFilm} from "@/helpers/letterboxd";

/** How many unfound films show before "Show all"; a long tail would push the import button far down. */
const UNMATCHED_PREVIEW = 8;

const Note = ({children}: {children: string}) => <Text className="font-sans text-[13px] leading-5 text-muted-foreground">{children}</Text>;

const Steps = () => {
    const {t} = useTranslation("settings");
    const steps = [t("letterboxd.steps.export"), t("letterboxd.steps.download"), t("letterboxd.steps.pick")];
    return (
        <View className="gap-3 rounded-2xl bg-surface p-4">
            {steps.map((step, index) => (
                <View key={step} className="flex-row gap-3">
                    <View className="h-6 w-6 items-center justify-center rounded-full bg-brand/15">
                        <Text className="font-sans-semibold text-xs text-brand">{index + 1}</Text>
                    </View>
                    <Text className="min-w-0 flex-1 font-sans text-[15px] leading-6 text-foreground">{step}</Text>
                </View>
            ))}
        </View>
    );
};

const SummaryStats = ({summary}: {summary: ImportSummary}) => {
    const {t} = useTranslation("settings");
    return (
        <View className="gap-2">
            <StatStrip
                stats={[
                    {value: String(summary.films), label: t("letterboxd.stats.films")},
                    {value: String(summary.viewings), label: t("letterboxd.stats.viewings")},
                    {value: String(summary.ratings), label: t("letterboxd.stats.ratings")},
                ]}
            />
            <StatStrip
                stats={[
                    {value: String(summary.reviews), label: t("letterboxd.stats.reviews")},
                    {value: String(summary.watchlist), label: t("letterboxd.stats.watchlist")},
                    {value: String(summary.liked), label: t("letterboxd.stats.liked")},
                ]}
            />
            {summary.lists > 0 ? <Note>{t("letterboxd.listsFound", {count: summary.lists, entries: summary.listEntries})}</Note> : null}
        </View>
    );
};

const UnmatchedFilms = ({films}: {films: LetterboxdFilm[]}) => {
    const {t} = useTranslation("settings");
    const [isShowingAll, setIsShowingAll] = useState(false);
    const shown = isShowingAll ? films : films.slice(0, UNMATCHED_PREVIEW);

    return (
        <Section title={t("letterboxd.unmatched", {count: films.length})} index={1}>
            <Note>{t("letterboxd.unmatchedHint")}</Note>
            <View className="overflow-hidden rounded-2xl bg-surface">
                {shown.map((film, index) => (
                    <View key={film.key} className={index > 0 ? "border-t border-border px-4 py-3" : "px-4 py-3"}>
                        <Text className="font-sans text-[15px] text-foreground" numberOfLines={1}>
                            {film.name}
                            {film.year ? <Text className="text-muted-foreground">{` · ${film.year}`}</Text> : null}
                        </Text>
                    </View>
                ))}
            </View>
            {films.length > UNMATCHED_PREVIEW && !isShowingAll ? (
                <Button variant="outline" label={t("letterboxd.showAll", {count: films.length})} onPress={() => setIsShowingAll(true)}/>
            ) : null}
        </Section>
    );
};

/**
 * Brings a Letterboxd history in: the export's diary, ratings, watched films, reviews, likes and watchlist.
 * Films are found on TMDB by name and year, shown as a preview, and only then written to the library.
 */
export const LetterboxdImportPage = () => {
    const {t} = useTranslation("settings");
    const success = String(useCSSVariable("--color-success"));
    const {state, choose, confirm, reset} = useLetterboxdImport();

    const runImport = async () => {
        try {
            await confirm();
            haptics.success();
        } catch {
            toast.error(t("letterboxd.failed"));
        }
    };

    const renderStep = () => {
        switch (state.step) {
            case "idle":
                return (
                    <>
                        <Steps/>
                        <Note>{t("letterboxd.keepsYours")}</Note>
                        {state.error ? <Text className="font-sans-medium text-[13px] text-danger">{t(`letterboxd.errors.${state.error}`)}</Text> : null}
                        <Button variant="brand" icon={FileUp} label={t("letterboxd.choose")} onPress={() => void choose()}/>
                    </>
                );
            case "matching":
                return (
                    <Reveal variant="fade" className="gap-3 rounded-2xl bg-surface p-4">
                        <Text className="font-sans-semibold text-[15px] text-foreground">{t("letterboxd.matching")}</Text>
                        <ProgressBar percent={state.total ? (state.done / state.total) * 100 : 0}/>
                        <Text className="font-sans text-[13px] text-muted-foreground">{t("letterboxd.progress", {done: state.done, total: state.total})}</Text>
                        <Note>{t("letterboxd.stayHere")}</Note>
                    </Reveal>
                );
            case "preview":
            case "importing": {
                const isImporting = state.step === "importing";
                return (
                    <>
                        <Section title={t("letterboxd.found")}>
                            <SummaryStats summary={state.summary}/>
                            <Note>{t("letterboxd.keepsYours")}</Note>
                        </Section>
                        <View className="gap-2">
                            <Button
                                variant="brand"
                                label={isImporting ? t("letterboxd.importing") : t("letterboxd.import", {count: state.summary.films})}
                                isLoading={isImporting}
                                disabled={!state.summary.films && !state.summary.lists}
                                onPress={() => void runImport()}
                            />
                            <Button variant="outline" label={t("letterboxd.another")} disabled={isImporting} onPress={reset}/>
                        </View>
                        {state.result.unmatched.length > 0 && <UnmatchedFilms films={state.result.unmatched}/>}
                    </>
                );
            }
            case "done":
                return (
                    <EmptyState
                        icon={<CircleCheck size={32} strokeWidth={1.75} color={success}/>}
                        title={t("letterboxd.doneTitle")}
                        description={[t("letterboxd.doneBody", {count: state.summary.films, viewings: state.summary.viewings}), state.summary.lists ? t("letterboxd.doneLists", {count: state.summary.lists}) : ""].filter(Boolean).join(" ")}
                        action={<Button variant="brand" label={t("letterboxd.openDiary")} onPress={() => router.replace(ROUTES.DIARY)}/>}
                    />
                );
        }
    };

    return (
        <Screen>
            <BackButton className="self-start"/>
            <PageTitle title={t("letterboxd.title")} eyebrow={t("letterboxd.eyebrow")}/>
            {renderStep()}
        </Screen>
    );
};
