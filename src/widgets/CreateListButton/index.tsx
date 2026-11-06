import {useState} from "react";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {Plus} from "lucide-react-native";
import {Button, type ButtonVariant} from "@/components/ui/button";
import {ListFormSheet} from "@/widgets/ListFormSheet";
import {useCreateList} from "@/hooks/lists";
import {createListId} from "@/helpers/lists";
import {buildRoute} from "@/constants/routes";

type CreateListButtonProps = {
    variant?: ButtonVariant;
    className?: string;
};

/** Opens the new-list sheet and, once created, the empty list so the user can start filling it. */
export const CreateListButton = ({variant = "brand", className}: CreateListButtonProps) => {
    const {t} = useTranslation("lists");
    const [isOpen, setIsOpen] = useState(false);
    const {mutateAsync: createList} = useCreateList();

    const create = async (details: {name: string; description: string}) => {
        const id = createListId();
        const isCreated = await createList({id, details}).then(() => true, () => false);
        if (isCreated) router.push(buildRoute.userList(id));
        return isCreated;
    };

    return (
        <>
            <Button variant={variant} icon={Plus} label={t("form.createTitle")} className={className} onPress={() => setIsOpen(true)}/>
            <ListFormSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title={t("form.createTitle")} submitLabel={t("form.create")} onSubmit={create}/>
        </>
    );
};
