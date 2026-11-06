import {Alert} from "react-native";
import {useQueryClient} from "@tanstack/react-query";
import {useTranslation} from "react-i18next";
import {exportBackup, importBackup} from "@/api/backup.api";
import {QUERY_KEYS} from "@/constants/other";

/** Export to a file through the share sheet, and restore from one; the outcome is reported in an alert. */
export const useBackupActions = () => {
    const {t} = useTranslation("profile");
    const queryClient = useQueryClient();

    const runExport = async () => {
        try {
            await exportBackup();
        } catch {
            Alert.alert(t("backup.title"), t("backup.exportFailed"));
        }
    };

    const runImport = async () => {
        try {
            const result = await importBackup();
            if (result.status === "imported") {
                void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.LIBRARY]});
                void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.PROFILE]});
                Alert.alert(t("backup.title"), t("backup.imported"));
            } else if (result.status === "invalid") {
                Alert.alert(t("backup.title"), t("backup.invalid"));
            }
        } catch {
            Alert.alert(t("backup.title"), t("backup.importFailed"));
        }
    };

    return {runExport, runImport};
};
