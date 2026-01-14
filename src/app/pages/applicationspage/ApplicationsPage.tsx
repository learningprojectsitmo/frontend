import "./ApplicationsPage.css";
import "../pages.css";
import { DefaultPageScreen } from "../../../shared/components/screens/DefaultPageScreen";
//import { useContext } from 'react';
//import { Context } from '../../main';

export function ApplicationsPage() {
    //const {store} =useContext(Context);

    return (
        <DefaultPageScreen pageName="Заявки" profileName="Иванов Иван" navbarOption={5}>
            <div></div>
        </DefaultPageScreen>
    );
}
