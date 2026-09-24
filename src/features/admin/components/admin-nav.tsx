import { NavLink } from "react-router";
import type { IconName } from "@/components/ui/icons";
import { Icon } from "@/components/ui/icons";
import { paths } from "@/config/paths";
import { cn } from "@/lib/utils";

const ADMIN_SECTIONS: { label: string; href: string; icon: IconName; end?: boolean }[] = [
    { label: "Обзор", href: paths.app.admin.root.getHref(), icon: "grid", end: true },
    { label: "Пользователи", href: paths.app.admin.users.getHref(), icon: "members" },
    { label: "Роли и доступы", href: paths.app.admin.roles.getHref(), icon: "settings" },
    { label: "Идеи", href: paths.app.admin.ideas.getHref(), icon: "lightbulb" },
    { label: "Аудит", href: paths.app.admin.audit.getHref(), icon: "list" },
    { label: "Сессии", href: paths.app.admin.sessions.getHref(), icon: "status" },
];

export const AdminNav = () => {
    return (
        <nav className="flex flex-wrap items-center gap-1 border-b border-[--color-black-10] bg-app-surface px-6">
            {ADMIN_SECTIONS.map((section) => (
                <NavLink
                    key={section.href}
                    to={section.href}
                    end={section.end}
                    className={({ isActive }) =>
                        cn(
                            "flex items-center gap-2 px-3 py-3 text-[13px] font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-900 transition-colors",
                            isActive && "text-gray-900 border-[#2563EB]",
                        )
                    }
                >
                    <Icon name={section.icon} size={16} />
                    <span>{section.label}</span>
                </NavLink>
            ))}
        </nav>
    );
};
