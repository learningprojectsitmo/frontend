import type { ReactElement } from "react";

export interface DefaultPageScreenProps {
    children: ReactElement | ReactElement[]
    pageName: string
    profileName: string
    navbarOption: number
}