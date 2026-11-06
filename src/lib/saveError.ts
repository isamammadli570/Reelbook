import i18n from "@/i18n";
import {AccountRequiredError} from "@/lib/accountGate";
import {toast} from "@/lib/toast";

/**
 * Tells the user a change was not saved. A write stopped for want of an account is left alone:
 * the sign-in prompt is already on screen and says why.
 */
export const reportSaveError = (error: unknown): void => {
    if (error instanceof AccountRequiredError) return;
    toast.error(i18n.t("common:toast.saveFailed"));
};
