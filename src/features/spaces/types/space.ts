import type { CategoryName, SpaceColor } from "../constants/spaces";

export type Space = {
    id: number;
    title: string;
    projectsCount: number;
    color: SpaceColor;
};

export type Category = {
    name: CategoryName;
    spaces: Space[];
};
