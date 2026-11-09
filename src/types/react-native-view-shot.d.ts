// react-native-view-shot ships its TypeScript source to Metro, and that source does not compile under this
// project's `verbatimModuleSyntax`. Only the picture-taking call is used, so it is typed here and tsconfig
// `paths` points the package name at this file instead of the library's source.
import type {HostInstance} from "react-native";

export type CaptureOptions = {
    format?: "png" | "jpg" | "webm" | "raw";
    quality?: number;
    result?: "tmpfile" | "base64" | "data-uri" | "zip-base64";
};

export function captureRef(view: HostInstance | number | null, options?: CaptureOptions): Promise<string>;
