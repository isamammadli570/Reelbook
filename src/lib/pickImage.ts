import {Platform} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {ImageManipulator, SaveFormat} from "expo-image-manipulator";

export type PickedImage = {uri: string; base64: string};

type PickOptions = {
    /** The crop the system editor offers, where it can crop to a shape. */
    aspect: [number, number];
    /** Target size of the shorter side for a square, of the width for anything wider. */
    pixels: number;
    /** iOS's editor only crops squares, so a wide image is taken whole there and cropped on screen instead. */
    canCrop: boolean;
};

const pick = async ({aspect, pixels, canCrop}: PickOptions): Promise<PickedImage | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({mediaTypes: ["images"], allowsEditing: canCrop, aspect, quality: 1});
    const asset = result.canceled ? null : result.assets[0];
    if (!asset) return null;

    const isSquare = aspect[0] === aspect[1];
    // A square avatar resizes its shorter side so it always covers the circle; a cover resizes its width.
    const resize = isSquare && asset.width > asset.height ? {height: pixels} : {width: Math.min(pixels, asset.width || pixels)};
    const rendered = await ImageManipulator.manipulate(asset.uri).resize(resize).renderAsync();
    const saved = await rendered.saveAsync({format: SaveFormat.JPEG, compress: 0.82, base64: true});
    return saved.base64 ? {uri: saved.uri, base64: saved.base64} : null;
};

/** A square profile photo, big enough for a sharp 92pt avatar on a 3× screen. */
export const pickAvatar = () => pick({aspect: [1, 1], pixels: 512, canCrop: true});

/** A wide cover photo, sized for the full width of a large phone. */
export const pickCover = () => pick({aspect: [16, 9], pixels: 1280, canCrop: Platform.OS === "android"});
