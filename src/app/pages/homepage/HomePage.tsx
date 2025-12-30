import "./HomePage.css";
import "../pages.css";
import { DefaultPageScreen } from "../../../shared/components/screens/DefaultPageScreen";

export function HomePage() {
    return (
        <DefaultPageScreen pageName="Главная" profileName="Иванов Иван" navbarOption={1}>
            <div></div>
        </DefaultPageScreen>
    );
}
