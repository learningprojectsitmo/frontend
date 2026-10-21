import { type ResumeSpaceAssign, type ResumeSpaceOut } from "@/types/api";
import { Checkbox } from "@/components/ui/checkbox/checkbox";

type SpaceOption = { id: number; title: string };

type Props = {
    /** Пространства текущего пользователя — из них выбирается публикация. */
    available: SpaceOption[];
    /** Назначения, пришедшие с бэкенда (для режима просмотра). */
    assigned: ResumeSpaceOut[];
    /** Текущее состояние выбора в режиме редактирования. */
    value?: ResumeSpaceAssign[];
    onChange?: (next: ResumeSpaceAssign[]) => void;
    isEditing?: boolean;
};

export const SpacesCard = ({ available, assigned, value = [], onChange, isEditing }: Props) => {
    const toggleSpace = (spaceId: number, checked: boolean) => {
        if (!onChange) return;
        if (checked) {
            // Не основное по умолчанию: «основное» включается отдельным тумблером,
            // иначе резюме молча станет главным в пространстве.
            onChange([...value, { workspace_id: spaceId, is_default: false }]);
        } else {
            onChange(value.filter((item) => item.workspace_id !== spaceId));
        }
    };

    const toggleDefault = (spaceId: number, isDefault: boolean) => {
        if (!onChange) return;
        onChange(
            value.map((item) =>
                item.workspace_id === spaceId ? { ...item, is_default: isDefault } : item,
            ),
        );
    };

    return (
        <div className="bg-app-surface rounded-3xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-base font-semibold tracking-tight mb-1">Пространства</h3>
            <p className="text-xs text-gray-400 mb-4">
                {isEditing
                    ? "Выберите пространства, в которых показывать резюме. «Основное» — резюме, которое увидят на странице пространства."
                    : "Пространства, на которые опубликовано резюме"}
            </p>

            {isEditing ? (
                available.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        Вы пока не состоите ни в одном пространстве
                    </p>
                ) : (
                    <div className="flex flex-col gap-3">
                        {available.map((space) => {
                            const assignment = value.find((item) => item.workspace_id === space.id);
                            const checked = !!assignment;
                            return (
                                <div
                                    key={space.id}
                                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-gray-100 px-3 py-2"
                                >
                                    <label className="flex items-center gap-2 cursor-pointer min-w-0">
                                        <Checkbox
                                            checked={checked}
                                            onCheckedChange={(state) =>
                                                toggleSpace(space.id, state === true)
                                            }
                                        />
                                        <span className="text-sm text-gray-800 truncate">
                                            {space.title}
                                        </span>
                                    </label>
                                    {checked && (
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <Checkbox
                                                checked={assignment?.is_default ?? false}
                                                onCheckedChange={(state) =>
                                                    toggleDefault(space.id, state === true)
                                                }
                                            />
                                            <span className="text-xs text-gray-500">
                                                Основное в пространстве
                                            </span>
                                        </label>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )
            ) : assigned.length === 0 ? (
                <p className="text-sm text-gray-500">
                    Резюме не опубликовано ни в одном пространстве
                </p>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {assigned.map((space) => (
                        <span
                            key={space.workspace_id}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-700"
                        >
                            {space.workspace_name}
                            {space.is_default && (
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#2563EB] bg-[#2563EB]/10 rounded-full px-2 py-0.5">
                                    Основное
                                </span>
                            )}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};
