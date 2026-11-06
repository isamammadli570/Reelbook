import {Modal, Pressable, Text} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {router} from "expo-router";
import {useTranslation} from "react-i18next";
import {LogOut, Pencil, Settings, type LucideIcon} from "lucide-react-native";
import {FadeIn} from "react-native-reanimated";
import {useCSSVariable} from "uniwind";
import {AnimatedView} from "@/components/ui/animated";
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

/** The profile's overflow menu, anchored under the ⋮ button: edit, settings and sign out. */
export const ProfileMenu = ({isOpen, onClose}: ProfileMenuProps) => {
    const {t} = useTranslation("profile");
    const insets = useSafeAreaInsets();
    const [foreground, danger] = useCSSVariable(["--color-foreground", "--color-danger"]).map(String);
    const {signOut, isSigningOut} = useSignOut();

    const go = (route: string) => {
        onClose();
        router.push(route);
    };

    const items: MenuItem[] = [
        {label: t("menu.edit"), icon: Pencil, onPress: () => go(ROUTES.EDIT_PROFILE)},
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
        <Modal visible={isOpen} transparent animationType="none" onRequestClose={onClose}>
            <Pressable className="flex-1 bg-black/40" onPress={onClose} aria-label={t("menu.close")}>
                <AnimatedView
                    entering={FadeIn.duration(160)}
                    className="absolute right-5 w-60 overflow-hidden rounded-2xl border border-border bg-surface-raised"
                    style={{top: insets.top + 60}}
                >
                    {items.map((item, index) => (
                        <Pressable
                            key={item.label}
                            onPress={item.onPress}
                            disabled={item.isDanger && isSigningOut}
                            className={cn("flex-row items-center justify-between px-4 py-3.5 active:bg-surface", index > 0 && "border-t border-border")}
                        >
                            <Text className={cn("font-sans-medium text-[15px]", item.isDanger ? "text-danger" : "text-foreground")}>{item.label}</Text>
                            <item.icon size={20} strokeWidth={1.8} color={item.isDanger ? danger : foreground}/>
                        </Pressable>
                    ))}
                </AnimatedView>
            </Pressable>
        </Modal>
    );
};
