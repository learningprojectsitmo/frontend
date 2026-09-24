import { ArrowUpRight, Newspaper, Route } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type LinkItem = {
    icon: LucideIcon;
    label: string;
    href: string;
};

const links: LinkItem[] = [
    { icon: Newspaper, label: "Новости на день раньше в Telegram", href: "#" },
    { icon: Route, label: "Обновления и планы в roadmap", href: "#" },
];

export function InfoCard() {
    return (
        <div className="bg-app-surface border border-[--color-black-10] rounded-[14px] p-4 space-y-2">
            {links.map((link) => (
                <a
                    key={link.label}
                    href={link.href}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-[--azure-46] hover:bg-gray-100 hover:text-[--grey-4] transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <link.icon size={18} className="text-[--azure-60]" />
                        <span>{link.label}</span>
                    </div>
                    <ArrowUpRight
                        size={16}
                        className="text-gray-300 group-hover:text-[--azure-60] transition-colors"
                    />
                </a>
            ))}
        </div>
    );
}
