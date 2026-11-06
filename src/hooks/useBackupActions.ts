import {useState} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {useTranslation} from "react-i18next";
import {exportBackup, importBackup} from "@/api/backup.api";
import {toast} from "@/lib/toast";
import {QUERY_KEYS} from "@/constants/other";

/** Export to a file (shared on a phone, downloaded on the web), and restore from one; the outcome is reported in a toast. */
export const useBackupActions = () => {
    const {t} = useTranslation("profile");
    const queryClient = useQueryClient();
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const runExport = async () => {
        setIsExporting(true);
        try {
            await exportBackup();
        } catch {
            toast.error(t("backup.exportFailed"));
        } finally {
            setIsExporting(false);
        }
    };

    const runImport = async () => {
        setIsImporting(true);
        try {
            const result = await importBackup();
            if (result.status === "imported") {
                void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.LIBRARY]});
                void queryClient.invalidateQueries({queryKey: [QUERY_KEYS.PROFILE]});
                toast.success(t("backup.imported"));
            } else if (result.status === "invalid") {
                toast.error(t("backup.invalid"));
            }
        } catch {
            toast.error(t("backup.importFailed"));
        } finally {
            setIsImporting(false);
        }
    };

    return {runExport, runImport, isExporting, isImporting};
};
