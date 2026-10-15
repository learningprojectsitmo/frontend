import type { BackendMember } from "@/types/api";
import type { ProjectMember } from "@/types/tables/forTables";

const toProjectMember = (member: BackendMember): ProjectMember => {
    const [firstName = "", ...rest] = (member.name ?? "").trim().split(/\s+/);
    return {
        id: member.user_id,
        firstName,
        lastName: rest.join(" "),
        email: member.contacts,
    };
};

export const toProjectMembers = (members: BackendMember[] | undefined): ProjectMember[] => {
    const unique = new Map<number, ProjectMember>();
    for (const member of members ?? []) {
        if (!unique.has(member.user_id)) {
            unique.set(member.user_id, toProjectMember(member));
        }
    }
    return [...unique.values()];
};
