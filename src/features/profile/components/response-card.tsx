import { Link } from "react-router";

const FOLDER_COLORS = ["#2563EB", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#F97316"];

function getFolderColor(projectId: number): string {
    return FOLDER_COLORS[projectId % FOLDER_COLORS.length];
}

function FolderIcon({ color }: { color: string }) {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M2.5 4.5C2.5 3.94772 2.94772 3.5 3.5 3.5H7.5L9.5 5.5H16.5C17.0523 5.5 17.5 5.94772 17.5 6.5V15.5C17.5 16.0523 17.0523 16.5 16.5 16.5H3.5C2.94772 16.5 2.5 16.0523 2.5 15.5V4.5Z"
                fill={color}
                fillOpacity="0.15"
                stroke={color}
                strokeWidth="1.2"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export type ResponseCardAction = {
    label: string;
    variant: "primary" | "outline" | "ghost";
    onClick: () => void;
};

type ResponseCardProps = {
    projectId: number;
    projectName: string;
    description: string;
    role: string;
    resumeUrl: string;
    resumeTitle: string;
    date: string;
    dateLabel: string;
    status?: { text: string; color: string; bg: string } | null;
    actions?: ResponseCardAction[];
};

export function ResponseCard({
    projectId,
    projectName,
    description,
    role,
    resumeUrl,
    resumeTitle,
    date,
    dateLabel,
    status,
    actions,
}: ResponseCardProps) {
    const folderColor = getFolderColor(projectId);

    return (
        <div className="bg-app-surface border border-gray-200 rounded-[16px] p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                        style={{ backgroundColor: `${folderColor}1A` }}
                    >
                        <FolderIcon color={folderColor} />
                    </div>
                    <h3 className="text-[16px] font-bold text-gray-900 leading-tight">
                        {projectName}
                    </h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {status && (
                        <span
                            className="inline-flex items-center h-6 px-2.5 rounded-full text-[12px] font-medium leading-none"
                            style={{ backgroundColor: status.bg, color: status.color }}
                        >
                            {status.text}
                        </span>
                    )}
                    {actions?.map((action) => {
                        const base =
                            "inline-flex items-center h-8 px-3.5 rounded-[10px] text-[13px] font-medium transition-colors";
                        const variants = {
                            primary: "bg-[#2563EB] text-white hover:bg-[#1D4ED8]",
                            outline:
                                "bg-app-surface border border-gray-200 text-gray-900 hover:bg-gray-50",
                            ghost: "bg-transparent text-gray-500 hover:bg-gray-100",
                        };
                        return (
                            <button
                                key={action.label}
                                type="button"
                                onClick={action.onClick}
                                className={`${base} ${variants[action.variant]}`}
                            >
                                {action.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {description && (
                <p className="text-[13px] text-gray-500 leading-relaxed">{description}</p>
            )}

            <div className="flex items-stretch border border-gray-200 rounded-[12px] overflow-hidden text-[13px]">
                <div className="flex-1 px-3.5 py-2.5 flex flex-col gap-0.5 min-w-0">
                    <span className="text-gray-400 text-[12px]">Желаемая роль:</span>
                    <span className="text-gray-900 truncate font-medium">{role}</span>
                </div>
                <div className="w-px bg-gray-200" />
                <div className="flex-1 px-3.5 py-2.5 flex flex-col gap-0.5 min-w-0">
                    <span className="text-gray-400 text-[12px]">Резюме:</span>
                    {resumeUrl ? (
                        <Link
                            to={resumeUrl}
                            className="text-[#2563EB] truncate hover:underline font-medium"
                        >
                            {resumeTitle || role}
                        </Link>
                    ) : (
                        <span className="text-gray-900 truncate font-medium">
                            {resumeTitle || role}
                        </span>
                    )}
                </div>
            </div>

            <div className="text-[12px] text-gray-400">
                {dateLabel}: {date}
            </div>
        </div>
    );
}
