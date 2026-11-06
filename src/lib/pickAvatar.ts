import * as ImagePicker from "expo-image-picker";
import {ImageManipulator, SaveFormat} from "expo-image-manipulator";

/** Big enough for a sharp 92pt avatar on a 3× screen, small enough to load instantly. */
const AVATAR_PIXELS = 512;

export type PickedAvatar = {uri: string; base64: string};

/** Lets the user pick and square-crop a photo, then shrinks it to a small JPEG; `null` if they backed out. */
export const pickAvatar = async (): Promise<PickedAvatar | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 1});
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return null;

    // Resize the shorter side, so a non-square pick (the web has no crop step) still covers the circle.
    const resize = asset.width > asset.height ? {height: AVATAR_PIXELS} : {width: AVATAR_PIXELS};
    const rendered = await ImageManipulator.manipulate(asset.uri).resize(resize).renderAsync();
    const saved = await rendered.saveAsync({format: SaveFormat.JPEG, compress: 0.82, base64: true});
    if (!saved.base64) return null;
    return {uri: saved.uri, base64: saved.base64};
};
