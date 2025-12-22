import { Sider } from "../mainpage/Sider";
import { Header } from "../mainpage/Header";
import "./DefaultPageScreen.css";
import type { DefaultPageScreenProps } from "../../types/props/DefaultPageScreenProps";

export function DefaultPageScreen({ children, pageName, profileName, navbarOption }: DefaultPageScreenProps) {
    return (
        <div className="outer-wrapper">
            <Sider navbarOption={navbarOption} />
            <div className="header-wrapper">
                <Header pageName={pageName} profileName={profileName} />
                <div>{children}</div>
            </div>
        </div>
    )
}