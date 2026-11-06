import {useState} from "react";
import {Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {Pencil} from "lucide-react-native";
import {Button} from "@/components/ui/button";
import {ReviewDialog} from "@/widgets/ReviewDialog";
import {Section} from "@/widgets/Section";
import {useDateFormat} from "@/hooks/useDateFormat";
import {useSession} from "@/hooks/auth/useSession";
import {openAccountPrompt} from "@/lib/accountGate";
import {hasSupabase} from "@/lib/env";
import type {LibraryItem, MediaSnapshot} from "@/api/library.api";

type ReviewSectionProps = {
    snapshot: MediaSnapshot;
    item: LibraryItem | undefined;
};

/** The user's own review as a quote. Writing one needs an account, so a guest is asked to sign in instead of typing. */
export const ReviewSection = ({snapshot, item}: ReviewSectionProps) => {
    const {t} = useTranslation("details");
    const {shortDate} = useDateFormat();
    const {session} = useSession();
    const [isEditing, setIsEditing] = useState(false);
    const review = item?.review ?? null;

    const startEditing = () => {
        if (hasSupabase && !session) openAccountPrompt();
        else setIsEditing(true);
    };

    return (
        <Section title={t("review.title")}>
            {review ? (
                <View className="gap-3 rounded-2xl bg-surface p-4">
                    <Text className="font-serif-italic text-lg leading-[24px] text-foreground">“{review.text}”</Text>
                    <View className="flex-row items-center justify-between">
                        <Text className="font-sans text-xs text-muted-foreground">{shortDate(review.updatedAt)}</Text>
                        <Button variant="outline" icon={Pencil} label={t("review.edit")} className="h-9 px-3" onPress={startEditing}/>
                    </View>
                </View>
            ) : (
                <Button variant="outline" icon={Pencil} label={t("review.write")} onPress={startEditing}/>
            )}
            <ReviewDialog snapshot={snapshot} item={item} isOpen={isEditing} onClose={() => setIsEditing(false)}/>
        </Section>
    );
};
