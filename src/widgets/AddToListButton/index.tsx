import {useState} from "react";
import {useTranslation} from "react-i18next";
import {ListPlus} from "lucide-react-native";
import {Button} from "@/components/ui/button";
import {AddToListSheet} from "@/widgets/AddToListSheet";
import {useSession} from "@/hooks/auth/useSession";
import {openAccountPrompt} from "@/lib/accountGate";
import {hasSupabase} from "@/lib/env";
import type {MediaSnapshot} from "@/api/library.api";

type AddToListButtonProps = {snapshot: MediaSnapshot};

/** Icon button beside the watchlist toggle; a guest is asked to sign in instead of seeing an empty sheet. */
export const AddToListButton = ({snapshot}: AddToListButtonProps) => {
    const {t} = useTranslation("lists");
    const {session} = useSession();
    const [isOpen, setIsOpen] = useState(false);

    const open = () => {
        if (hasSupabase && !session) openAccountPrompt();
        else setIsOpen(true);
    };

    return (
        <>
            <Button icon={ListPlus} aria-label={t("addTo.title")} onPress={open}/>
            <AddToListSheet snapshot={snapshot} isOpen={isOpen} onClose={() => setIsOpen(false)}/>
        </>
    );
};
