import {useMemo, useState} from "react";
import {Pressable, ScrollView, Text, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {router} from "expo-router";
import {LinearGradient} from "expo-linear-gradient";
import {Controller, useForm, useWatch} from "react-hook-form";
import {useTranslation} from "react-i18next";
import {Camera, Check, ImageOff, ImagePlus, Trash2} from "lucide-react-native";
import {useCSSVariable} from "uniwind";
import {PressScale} from "@/components/motion/PressScale";
import {Reveal} from "@/components/motion/Reveal";
import {Button} from "@/components/ui/button";
import {Image} from "@/components/ui/image";
import {FormInput} from "@/components/form/FormInput";
import {AccountRequired} from "@/widgets/AccountRequired";
import {Avatar} from "@/widgets/Avatar";
import {BackButton} from "@/widgets/BackButton";
import {Screen} from "@/widgets/Screen";
import {Section} from "@/widgets/Section";
import {useSession} from "@/hooks/auth/useSession";
import {useGetLibrary} from "@/hooks/library";
import {useGetProfile, useSaveProfile} from "@/hooks/profile";
import {isUsernameAvailable} from "@/api/auth.api";
import {removeAvatar, uploadAvatar} from "@/api/avatar.api";
import {EMPTY_PROFILE} from "@/api/profile.api";
import {withAlpha} from "@/helpers/details";
import {imageUrl} from "@/helpers/media";
import {coverChoices} from "@/helpers/shelves";
import {isValidUsername, normalizeUsername} from "@/helpers/username";
import {hasSupabase} from "@/lib/env";
import {pickAvatar, type PickedAvatar} from "@/lib/pickAvatar";
import {cn} from "@/lib/utils";
import {AVATAR_COLORS, IMAGE_SIZE, PROFILE_BIO_MAX, PROFILE_LIMITS, type AvatarColor} from "@/constants/other";

const COVER_HEIGHT = 200;
const THUMB_WIDTH = 132;
const THUMB_HEIGHT = 74;

type ProfileFormValues = {name: string; username: string; bio: string};

/** A live preview of the profile while editing: a photo or avatar colour, a cover from your own titles, then name, @username and bio. */
export const EditProfilePage = () => {
    const {t} = useTranslation("profile");
    const insets = useSafeAreaInsets();
    const [background, brandInk, muted] = useCSSVariable(["--color-background", "--color-brand-ink", "--color-muted-foreground"]).map(String);
    const {session, isLoading: isSessionLoading} = useSession();
    const {data: profile = EMPTY_PROFILE} = useGetProfile();
    const {data: library} = useGetLibrary();
    const {mutateAsync: saveProfile} = useSaveProfile();

    // `undefined` means "unchanged", so the stored profile shows until the user picks something.
    const [pickedCover, setPickedCover] = useState<string | null | undefined>(undefined);
    const [pickedColor, setPickedColor] = useState<AvatarColor | undefined>(undefined);
    // `null` means "remove the photo"; the upload waits for Save, so backing out changes nothing.
    const [pickedPhoto, setPickedPhoto] = useState<PickedAvatar | null | undefined>(undefined);
    const [photoError, setPhotoError] = useState<string | null>(null);
    const photoUrl = pickedPhoto === undefined ? profile.avatarUrl : pickedPhoto?.uri ?? null;
    const coverPath = pickedCover === undefined ? profile.coverPath : pickedCover;
    const avatarColor = pickedColor ?? profile.avatarColor;
    const covers = useMemo(() => (library ? coverChoices(library) : []), [library]);

    const {control, handleSubmit, setError, formState: {errors, isSubmitting}} = useForm<ProfileFormValues>({
        mode: "onTouched",
        values: {name: profile.name, username: profile.username, bio: profile.bio},
    });
    const [watchedName, watchedBio] = useWatch({control, name: ["name", "bio"]});
    const previewName = watchedName || t("defaultName");
    const bioLength = (watchedBio ?? "").length;

    if (hasSupabase && !session && !isSessionLoading) {
        return (
            <Screen>
                <BackButton className="self-start"/>
                <AccountRequired description={t("guestDescription")}/>
            </Screen>
        );
    }

    const choosePhoto = async () => {
        setPhotoError(null);
        const picked = await pickAvatar().catch(() => {
            setPhotoError(t("edit.photoFailed"));
            return null;
        });
        if (picked) setPickedPhoto(picked);
    };

    /** The address to store: uploaded for an account, kept inline on a device without one. */
    const savePhoto = async (): Promise<string | null> => {
        const userId = session?.user.id;
        if (pickedPhoto === undefined) return profile.avatarUrl;
        if (pickedPhoto === null) {
            if (userId) await removeAvatar(userId).catch(() => undefined);
            return null;
        }
        return userId ? uploadAvatar(userId, pickedPhoto.base64) : `data:image/jpeg;base64,${pickedPhoto.base64}`;
    };

    const save = handleSubmit(async (values) => {
        const username = normalizeUsername(values.username);
        if (hasSupabase && username !== profile.username) {
            const isFree = await isUsernameAvailable(username).catch(() => null);
            if (isFree === null) {
                setError("username", {message: t("edit.usernameCheckFailed")});
                return;
            }
            if (!isFree) {
                setError("username", {message: t("edit.usernameTaken")});
                return;
            }
        }
        setPhotoError(null);
        const avatarUrl = await savePhoto().catch(() => undefined);
        if (avatarUrl === undefined) {
            setPhotoError(t("edit.photoUploadFailed"));
            return;
        }
        const isSaved = await saveProfile({...values, username, coverPath, avatarColor, avatarUrl}).then(() => true, () => false);
        if (isSaved) router.back();
    });

    const cover = imageUrl(coverPath, IMAGE_SIZE.BACKDROP);

    return (
        <Screen isEdgeToEdge>
            <View>
                <View className="w-full bg-brand-soft" style={{height: COVER_HEIGHT + insets.top}}>
                    {cover && <Image source={cover} className="h-full w-full" contentFit="cover" transition={250}/>}
                    <LinearGradient colors={[withAlpha(background, 0.35), withAlpha(background, 0), background]} locations={[0, 0.4, 1]} style={{position: "absolute", inset: 0}}/>
                    <BackButton className="absolute left-5" style={{top: insets.top + 8}}/>
                </View>
                <View className="flex-row items-end gap-4 px-5" style={{marginTop: -46}}>
                    <PressScale onPress={() => void choosePhoto()} aria-label={t("edit.choosePhoto")}>
                        <Avatar name={previewName} color={avatarColor} photoUrl={photoUrl} size={92} hasRing/>
                        <View className="absolute bottom-1 right-1 h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-brand">
                            <Camera size={14} strokeWidth={2.25} color={brandInk}/>
                        </View>
                    </PressScale>
                    <Text className="mb-2 flex-1 font-serif text-[28px] leading-[32px] text-foreground" numberOfLines={1}>{previewName}</Text>
                </View>
            </View>

            <View className="gap-8 px-5">
                <Section title={t("edit.cover")} index={0}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5" contentContainerClassName="gap-2.5 px-5">
                        <PressScale
                            onPress={() => setPickedCover(null)}
                            aria-label={t("edit.noCover")}
                            aria-selected={coverPath === null}
                            className={cn("items-center justify-center gap-1 rounded-xl border-2 bg-surface", coverPath === null ? "border-brand" : "border-transparent")}
                            style={{width: THUMB_WIDTH, height: THUMB_HEIGHT}}
                        >
                            <ImageOff size={20} strokeWidth={1.8} color={muted}/>
                            <Text className="font-sans text-[11px] text-muted-foreground">{t("edit.noCover")}</Text>
                        </PressScale>
                        {covers.map((choice) => {
                            const isSelected = choice.path === coverPath;
                            return (
                                <PressScale
                                    key={choice.path}
                                    onPress={() => setPickedCover(choice.path)}
                                    aria-label={choice.title}
                                    aria-selected={isSelected}
                                    className={cn("overflow-hidden rounded-xl border-2", isSelected ? "border-brand" : "border-transparent")}
                                    style={{width: THUMB_WIDTH, height: THUMB_HEIGHT}}
                                >
                                    <Image source={imageUrl(choice.path, IMAGE_SIZE.BACKDROP)} className="h-full w-full" contentFit="cover"/>
                                    {isSelected && (
                                        <View className="absolute right-1.5 top-1.5 h-6 w-6 items-center justify-center rounded-full bg-brand">
                                            <Check size={14} strokeWidth={3} color={brandInk}/>
                                        </View>
                                    )}
                                </PressScale>
                            );
                        })}
                    </ScrollView>
                    {!covers.length && <Text className="font-sans text-sm leading-5 text-muted-foreground">{t("edit.noCovers")}</Text>}
                </Section>

                <Section title={t("edit.avatar")} index={1}>
                    <View className="flex-row gap-2">
                        <Button variant="outline" icon={ImagePlus} label={photoUrl ? t("edit.changePhoto") : t("edit.choosePhoto")} className="flex-1" onPress={() => void choosePhoto()}/>
                        {photoUrl && <Button variant="outline" icon={Trash2} aria-label={t("edit.removePhoto")} onPress={() => setPickedPhoto(null)}/>}
                    </View>
                    {photoError && <Text className="font-sans text-sm text-danger">{photoError}</Text>}
                    <Text className="font-sans text-xs text-muted-foreground">{t("edit.avatarColorHint")}</Text>
                    <View className="flex-row justify-between">
                        {(Object.keys(AVATAR_COLORS) as AvatarColor[]).map((color) => {
                            const isSelected = color === avatarColor;
                            return (
                                <Pressable
                                    key={color}
                                    onPress={() => setPickedColor(color)}
                                    role="radio"
                                    aria-checked={isSelected}
                                    aria-label={t(`edit.colors.${color}`)}
                                    className={cn("h-11 w-11 items-center justify-center rounded-full border-2", isSelected ? "border-foreground" : "border-transparent")}
                                >
                                    <View className="h-9 w-9 items-center justify-center rounded-full" style={{backgroundColor: AVATAR_COLORS[color].bg}}>
                                        {isSelected && <Check size={18} strokeWidth={3} color={AVATAR_COLORS[color].ink}/>}
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                </Section>

                <Reveal variant="rise" index={2} className="gap-4">
                    <Controller
                        control={control}
                        name="name"
                        rules={{maxLength: {value: PROFILE_LIMITS.NAME_MAX, message: t("edit.tooLong", {max: PROFILE_LIMITS.NAME_MAX})}}}
                        render={({field: {value, onChange, onBlur}}) => (
                            <FormInput label={t("edit.name")} placeholder={t("edit.namePlaceholder")} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.name?.message} autoCapitalize="words"/>
                        )}
                    />
                    <Controller
                        control={control}
                        name="username"
                        rules={{validate: (value) => !hasSupabase && !value ? true : isValidUsername(value) || t("edit.invalidUsername")}}
                        render={({field: {value, onChange, onBlur}}) => (
                            <FormInput label={t("edit.username")} placeholder="isa" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.username?.message} autoCapitalize="none" autoCorrect={false}/>
                        )}
                    />
                    <View className="gap-1">
                        <Controller
                            control={control}
                            name="bio"
                            rules={{maxLength: {value: PROFILE_BIO_MAX, message: t("edit.tooLong", {max: PROFILE_BIO_MAX})}}}
                            render={({field: {value, onChange, onBlur}}) => (
                                <FormInput label={t("edit.bio")} placeholder={t("edit.bioPlaceholder")} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.bio?.message} multiline/>
                            )}
                        />
                        <Text className={cn("self-end font-sans text-xs", bioLength > PROFILE_BIO_MAX ? "text-danger" : "text-subtle-foreground")}>{bioLength}/{PROFILE_BIO_MAX}</Text>
                    </View>
                    <Button variant="brand" label={t("edit.save")} disabled={isSubmitting} onPress={() => void save()}/>
                </Reveal>
            </View>
        </Screen>
    );
};
