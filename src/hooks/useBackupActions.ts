import {useState} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {useTranslation} from "react-i18next";
import {applyBackup, exportBackup, pickBackup} from "@/api/backup.api";
import {toast} from "@/lib/toast";
import {QUERY_KEYS} from "@/constants/other";
import type {Backup} from "@/helpers/backup";

/**
 * Export to a file (shared on a phone, downloaded on the web), and restore from one in two steps:
 * `pickImport` reads the file, then `pending` waits for `confirmImport` or `cancelImport`. The outcome is reported in a toast.
 */
export const useBackupActions = () => {
    const {t} = useTranslation("profile");
    const queryClient = useQueryClient();
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [pending, setPending] = useState<Backup | null>(null);

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

    const pickImport = async () => {
        setIsImporting(true);
        try {
            const result = await pickBackup();
            if (result.status === "picked") setPending(result.backup);
            else if (result.status === "invalid") toast.error(t("backup.invalid"));
        } catch {
            toast.error(t("backup.importFailed"));
        } finally {
            setIsImporting(false);
        }
    };

    const confirmImport = async () => {
        if (!pending) return;
        setIsImporting(true);
        try {
            await applyBackup(pending);
            [QUERY_KEYS.LIBRARY, QUERY_KEYS.LISTS, QUERY_KEYS.PROFILE].forEach((key) => void queryClient.invalidateQueries({queryKey: [key]}));
            toast.success(t("backup.imported"));
        } catch {
            toast.error(t("backup.importFailed"));
        } finally {
            setIsImporting(false);
            setPending(null);
        }
    };

    const cancelImport = () => setPending(null);

    return {runExport, pickImport, confirmImport, cancelImport, pending, isExporting, isImporting};
};
