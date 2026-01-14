import "./ResumePage.css";
import "../pages.css";
import { DefaultPageScreen } from "../../../shared/components/screens/DefaultPageScreen";

export function ResumePage() {
    return (
        <DefaultPageScreen pageName="Резюме" profileName="Иванов Иван" navbarOption={3}>
            <div></div>
        </DefaultPageScreen>
    );
}
