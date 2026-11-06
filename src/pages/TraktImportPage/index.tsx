import {useState} from "react";
import {ActivityIndicator, Linking, Text, View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {CircleCheck, ExternalLink, Link2} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {Reveal} from "@/components/motion/Reveal";
import {Button} from "@/components/ui/button";
import {AccountRequired} from "@/widgets/AccountRequired";
import {BackButton} from "@/widgets/BackButton";
import {EmptyState} from "@/widgets/EmptyState";
import {PageTitle} from "@/widgets/PageTitle";
import {ProgressBar} from "@/widgets/ProgressBar";
import {Screen} from "@/widgets/Screen";
import {Section} from "@/widgets/Section";
import {StatStrip} from "@/widgets/StatStrip";
import {useTraktImport} from "@/hooks/library";
import {useSelfId} from "@/hooks/social";
import {haptics} from "@/lib/haptics";
import {toast} from "@/lib/toast";
import {ROUTES} from "@/constants/routes";
import type {TraktSummary} from "@/helpers/trakt";

/** Titles shown before "Show all" in the not-found list. */
const MISSING_PREVIEW = 8;

const Note = ({children}: {children: string}) => <Text className="font-sans text-[13px] leading-5 text-muted-foreground">{children}</Text>;

const Steps = () => {
    const {t} = useTranslation("settings");
    const steps = [t("trakt.steps.connect"), t("trakt.steps.code"), t("trakt.steps.preview")];
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

const SummaryStats = ({summary}: {summary: TraktSummary}) => {
    const {t} = useTranslation("settings");
    return (
        <View className="gap-2">
            <StatStrip
                stats={[
                    {value: String(summary.films), label: t("trakt.stats.films")},
                    {value: String(summary.viewings), label: t("trakt.stats.viewings")},
                    {value: String(summary.ratings), label: t("trakt.stats.ratings")},
                ]}
            />
            <StatStrip
                stats={[
                    {value: String(summary.series), label: t("trakt.stats.series")},
                    {value: String(summary.episodes), label: t("trakt.stats.episodes")},
                    {value: String(summary.watchlist), label: t("trakt.stats.watchlist")},
                ]}
            />
            {summary.lists > 0 ? <Note>{t("trakt.listsFound", {count: summary.lists})}</Note> : null}
        </View>
    );
};

const MissingTitles = ({titles}: {titles: string[]}) => {
    const {t} = useTranslation("settings");
    const [isShowingAll, setIsShowingAll] = useState(false);
    const shown = isShowingAll ? titles : titles.slice(0, MISSING_PREVIEW);
    return (
        <Section title={t("trakt.missing", {count: titles.length})} index={1}>
            <Note>{t("trakt.missingHint")}</Note>
            <View className="overflow-hidden rounded-2xl bg-surface">
                {shown.map((title, index) => (
                    <Text key={`${title}-${index}`} className={index > 0 ? "border-t border-border px-4 py-3 font-sans text-[15px] text-foreground" : "px-4 py-3 font-sans text-[15px] text-foreground"} numberOfLines={1}>
                        {title}
                    </Text>
                ))}
            </View>
            {titles.length > MISSING_PREVIEW && !isShowingAll ? (
                <Button variant="outline" label={t("letterboxd.showAll", {count: titles.length})} onPress={() => setIsShowingAll(true)}/>
            ) : null}
        </Section>
    );
};

/**
 * Brings a Trakt history in: films with every viewing, watched episodes, ratings, the watchlist and lists.
 * Signing in happens on Trakt's own site with a short code, so the app never sees the Trakt password.
 */
export const TraktImportPage = () => {
    const {t} = useTranslation("settings");
    const [muted, success] = useCSSVariable(["--color-muted-foreground", "--color-success"]).map(String);
    const selfId = useSelfId();
    const {state, start, confirm, cancel} = useTraktImport();

    const runImport = async () => {
        try {
            await confirm();
            haptics.success();
        } catch {
            toast.error(t("trakt.failed"));
        }
    };

    const renderStep = () => {
        switch (state.step) {
            case "idle":
                return (
                    <>
                        <Steps/>
                        <Note>{t("trakt.keepsYours")}</Note>
                        {state.error ? <Text className="font-sans-medium text-[13px] text-danger">{t(`trakt.errors.${state.error}`)}</Text> : null}
                        <Button variant="brand" icon={Link2} label={t("trakt.connect")} onPress={() => void start()}/>
                    </>
                );
            case "connecting":
                return (
                    <Reveal variant="fade" className="items-center gap-4 rounded-2xl bg-surface p-5">
                        <Text className="text-center font-sans text-[15px] text-muted-foreground">{t("trakt.enterCode")}</Text>
                        <Text selectable className="font-sans-semibold text-[34px] tracking-[6px] text-foreground" aria-label={t("trakt.codeLabel", {code: state.userCode.split("").join(" ")})}>
                            {state.userCode}
                        </Text>
                        <Button variant="brand" icon={ExternalLink} label={t("trakt.openTrakt")} className="self-stretch" onPress={() => void Linking.openURL(state.verificationUrl)}/>
                        <View className="flex-row items-center gap-2">
                            <ActivityIndicator size="small" color={muted}/>
                            <Text className="font-sans text-[13px] text-muted-foreground">{t("trakt.waiting")}</Text>
                        </View>
                        <Button variant="outline" label={t("trakt.cancel")} className="self-stretch" onPress={cancel}/>
                    </Reveal>
                );
            case "fetching":
                return (
                    <Reveal variant="fade" className="flex-row items-center gap-3 rounded-2xl bg-surface p-4">
                        <ActivityIndicator color={muted}/>
                        <Text className="min-w-0 flex-1 font-sans-medium text-[15px] text-foreground">{t(`trakt.parts.${state.part}`)}</Text>
                    </Reveal>
                );
            case "matching":
                return (
                    <Reveal variant="fade" className="gap-3 rounded-2xl bg-surface p-4">
                        <Text className="font-sans-semibold text-[15px] text-foreground">{t("trakt.matching")}</Text>
                        <ProgressBar percent={state.total ? (state.done / state.total) * 100 : 0}/>
                        <Text className="font-sans text-[13px] text-muted-foreground">{t("trakt.progress", {done: state.done, total: state.total})}</Text>
                        <Note>{t("letterboxd.stayHere")}</Note>
                    </Reveal>
                );
            case "preview":
            case "importing": {
                const isImporting = state.step === "importing";
                const hasAnything = state.summary.films + state.summary.series + state.summary.ratings + state.summary.watchlist + state.summary.lists > 0;
                return (
                    <>
                        <Section title={t("letterboxd.found")}>
                            <SummaryStats summary={state.summary}/>
                            <Note>{t("trakt.keepsYours")}</Note>
                        </Section>
                        <View className="gap-2">
                            <Button variant="brand" label={isImporting ? t("letterboxd.importing") : t("trakt.import")} isLoading={isImporting} disabled={!hasAnything} onPress={() => void runImport()}/>
                            <Button variant="outline" label={t("trakt.cancel")} disabled={isImporting} onPress={cancel}/>
                        </View>
                        {state.missing.length > 0 && <MissingTitles titles={state.missing}/>}
                    </>
                );
            }
            case "done":
                return (
                    <EmptyState
                        icon={<CircleCheck size={32} strokeWidth={1.75} color={success}/>}
                        title={t("letterboxd.doneTitle")}
                        description={t("trakt.doneBody", {films: state.summary.films, series: state.summary.series})}
                        action={<Button variant="brand" label={t("letterboxd.openDiary")} onPress={() => router.replace(ROUTES.DIARY)}/>}
                    />
                );
        }
    };

    return (
        <Screen>
            <BackButton className="self-start"/>
            <PageTitle title={t("trakt.title")} eyebrow={t("letterboxd.eyebrow")}/>
            {selfId ? renderStep() : <AccountRequired description={t("trakt.guest")}/>}
        </Screen>
    );
};
