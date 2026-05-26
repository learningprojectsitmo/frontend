import { type ResumeLink } from "@/types/api";

type Props = {
    links: ResumeLink[];
};

const platformLabels: Record<string, string> = {
    behance: "Behance",
    dribbble: "Dribbble",
};

export const PortfolioCard = ({ links }: Props) => {
    return (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
            <h3 className="text-base font-semibold tracking-tight mb-4">Портфолио</h3>
            <div className="space-y-3">
                {links.map((link) => (
                    <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                        {platformLabels[link.platform.toLowerCase()] || link.platform}
                    </a>
                ))}
            </div>
        </div>
    );
};
