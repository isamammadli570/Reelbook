import {Alert, Platform} from "react-native";
import {useQueryClient} from "@tanstack/react-query";
import {useTranslation} from "react-i18next";
import {Download, Upload} from "lucide-react-native";
import {Button} from "@/components/ui/button";
import {Section} from "@/widgets/Section";
import {exportBackup, importBackup} from "@/api/backup.api";
import {QUERY_KEYS} from "@/constants/other";

/** Export and restore on the device. Hidden on web, where the share sheet and file picker are not available. */
export const BackupSection = () => {
    const {t} = useTranslation("profile");
    const queryClient = useQueryClient();

    if (Platform.OS === "web") return null;

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

    return (
        <Section title={t("backup.title")}>
            <Button variant="outline" icon={Download} label={t("backup.export")} onPress={() => void runExport()}/>
            <Button variant="outline" icon={Upload} label={t("backup.import")} onPress={() => void runImport()}/>
        </Section>
    );
};
