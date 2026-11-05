import {useState} from "react";
import {Text, View} from "react-native";
import {useTranslation} from "react-i18next";
import {Pencil} from "lucide-react-native";
import {Button} from "@/components/ui/button";
import {EditProfileDialog} from "@/pages/ProfilePage/widgets/EditProfileDialog";
import {useGetProfile} from "@/hooks/profile";
import {EMPTY_PROFILE} from "@/api/profile.api";

/** Avatar initial, name and bio, with the edit sheet behind a button. */
export const ProfileHeader = () => {
    const {t} = useTranslation("profile");
    const {data: profile = EMPTY_PROFILE} = useGetProfile();
    const [isEditing, setIsEditing] = useState(false);
    const name = profile.name || t("defaultName");

    return (
        <View className="gap-4">
            <View className="flex-row items-center gap-4">
                <View className="h-[72px] w-[72px] items-center justify-center rounded-full bg-brand">
                    <Text className="font-serif text-[36px] text-brand-ink">{name.charAt(0).toLocaleUpperCase()}</Text>
                </View>
                <View className="min-w-0 flex-1 gap-1">
                    <Text role="heading" aria-level={1} className="font-serif text-[34px] leading-[36px] text-foreground" numberOfLines={1}>{name}</Text>
                    <Text className="font-sans text-sm leading-5 text-muted-foreground" numberOfLines={2}>{profile.bio || t("addBio")}</Text>
                </View>
            </View>
            <Button variant="outline" icon={Pencil} label={t("edit")} onPress={() => setIsEditing(true)}/>
            <EditProfileDialog profile={profile} isOpen={isEditing} onClose={() => setIsEditing(false)}/>
        </View>
    );
};
