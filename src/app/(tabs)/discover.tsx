import {useTranslation} from "react-i18next";
import {ComingSoonPage} from "@/widgets/ComingSoonPage";

export default function Route() {
    const {t} = useTranslation();
    return <ComingSoonPage title={t("nav.discover")}/>;
}
