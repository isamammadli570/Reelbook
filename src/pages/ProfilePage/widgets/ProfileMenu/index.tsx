import {useState} from "react";
import {Text, View} from "react-native";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {ListPlus, LogOut, Pencil, Settings, type LucideIcon} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {PressScale} from "@/components/motion/PressScale";
import {ListFormSheet} from "@/widgets/ListFormSheet";
import {BusyOverlay} from "@/widgets/BusyOverlay";
import {Popover} from "@/widgets/Popover";
import {useCreateAndOpenList} from "@/hooks/lists";
import {useSignOut} from "@/hooks/auth/useSignOut";
import {ROUTES} from "@/constants/routes";
import {cn} from "@/lib/utils";

type MenuItem = {
    label: string;
    icon: LucideIcon;
    isDanger?: boolean;
    onPress: () => void;
};

type ProfileMenuProps = {
    isOpen: boolean;
    onClose: () => void;
};

/** The profile's overflow menu, anchored under the ⋮ button: edit, new list, settings and sign out. */
export const ProfileMenu = ({isOpen, onClose}: ProfileMenuProps) => {
    const {t} = useTranslation("profile");
    const [foreground, danger] = useCSSVariable(["--color-foreground", "--color-danger"]).map(String);
    const {signOut, isSigningOut} = useSignOut();
    const {t: tLists} = useTranslation("lists");
    const createList = useCreateAndOpenList();
    const [isCreatingList, setIsCreatingList] = useState(false);

    const go = (route: string) => {
        onClose();
        router.push(route);
    };

    const items: MenuItem[] = [
        {label: t("menu.edit"), icon: Pencil, onPress: () => go(ROUTES.EDIT_PROFILE)},
        {
            label: tLists("form.createTitle"),
            icon: ListPlus,
            onPress: () => {
                onClose();
                setIsCreatingList(true);
            },
        },
        {label: t("menu.settings"), icon: Settings, onPress: () => go(ROUTES.SETTINGS)},
        {
            label: t("menu.signOut"),
            icon: LogOut,
            isDanger: true,
            onPress: () => {
                onClose();
                void signOut();
            },
        },
    ];

    return (
        <>
            <Popover isOpen={isOpen} onClose={onClose} closeLabel={t("menu.close")}>
                <View className="w-60 overflow-hidden rounded-2xl border border-border bg-surface-raised">
                    {items.map((item, index) => (
                        <PressScale
                            key={item.label}
                            scaleTo={0.98}
                            onPress={item.onPress}
                            disabled={item.isDanger && isSigningOut}
                            className={cn("flex-row items-center justify-between px-4 py-3.5 active:bg-surface", index > 0 && "border-t border-border")}
                        >
                            <Text className={cn("font-sans-medium text-[15px]", item.isDanger ? "text-danger" : "text-foreground")}>{item.label}</Text>
                            <item.icon size={20} strokeWidth={1.8} color={item.isDanger ? danger : foreground}/>
                        </PressScale>
                    ))}
                </View>
            </Popover>
            {/* The menu closes at once; this shows the sign-out is under way until the app moves on. */}
            <BusyOverlay isVisible={isSigningOut} label={t("menu.signingOut")}/>
            <ListFormSheet
                isOpen={isCreatingList}
                onClose={() => setIsCreatingList(false)}
                title={tLists("form.createTitle")}
                submitLabel={tLists("form.create")}
                onSubmit={createList}
            />
        </>
    );
};
