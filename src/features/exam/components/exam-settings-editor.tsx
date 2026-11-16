import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import type { Exam, ExamConfiguration } from "@/types/exam";
import { toast } from "sonner";

type Props = {
    exam: Exam;
    onSave: (configuration: ExamConfiguration, reason: string) => Promise<void>;
};

const dateValue = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date() : date;
};

export const ExamSettingsEditor = ({ exam, onSave }: Props) => {
    const [configuration, setConfiguration] = useState(exam.configuration);
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => setConfiguration(exam.configuration), [exam.configuration]);

    const update = <K extends keyof ExamConfiguration>(key: K, value: ExamConfiguration[K]) =>
        setConfiguration((current) => ({ ...current, [key]: value }));

    const save = async () => {
        if (!reason.trim()) {
            toast.error("Укажите причину изменения настроек");
            return;
        }
        if (!configuration.title.trim() || configuration.title.length > 200 ||
            Number(configuration.max_score) <= 0 ||
            configuration.presentation_minutes < 1 ||
            configuration.questions_minutes < 0 ||
            configuration.transition_minutes < 0 ||
            configuration.assessment_window_minutes < 1 ||
            Object.values(configuration.weights).some((value) => value < 0 || value > 100) ||
            Object.values(configuration.weights).reduce((sum, value) => sum + value, 0) !== 100) {
            toast.error("Проверьте значения настроек");
            return;
        }
        setSaving(true);
        try {
            await onSave(configuration, reason.trim());
            setReason("");
        } finally {
            setSaving(false);
        }
    };

    const published = exam.status === "published";
    return (
        <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
                <Input value={configuration.title} onChange={(event) => update("title", event.target.value)} placeholder="Название" />
                <Input value={configuration.connection_url ?? ""} onChange={(event) => update("connection_url", event.target.value || null)} placeholder="https://..." />
                <textarea className="min-h-20 rounded-md border bg-app-surface p-2 text-sm md:col-span-2" value={configuration.description ?? ""} onChange={(event) => update("description", event.target.value)} placeholder="Описание" />
                <label className="text-sm text-app-muted">Дата начала
                    <div className="mt-1 flex items-center gap-2 rounded-md border px-2 py-1">
                        <DatePicker disabled={published} value={dateValue(configuration.starts_at)} onChange={(date) => {
                            const current = dateValue(configuration.starts_at);
                            date.setHours(current.getHours(), current.getMinutes(), 0, 0);
                            update("starts_at", date.toISOString());
                        }} />
                        <Input disabled={published} type="time" className="w-28 border-0" value={dateValue(configuration.starts_at).toTimeString().slice(0, 5)} onChange={(event) => {
                            const [hours, minutes] = event.target.value.split(":").map(Number);
                            const date = dateValue(configuration.starts_at);
                            date.setHours(hours, minutes, 0, 0);
                            update("starts_at", date.toISOString());
                        }} />
                    </div>
                </label>
                <label className="text-sm text-app-muted">Максимальный балл
                    <Input type="number" min={0.01} step="0.01" value={configuration.max_score} onChange={(event) => update("max_score", Number(event.target.value))} />
                </label>
                {([
                    ["presentation_minutes", "Выступление"],
                    ["questions_minutes", "Вопросы"],
                    ["transition_minutes", "Переход"],
                    ["assessment_window_minutes", "Окно оценивания"],
                ] as const).map(([key, label]) => (
                    <label key={key} className="text-sm text-app-muted">{label}, минут
                        <Input type="number" min={key === "presentation_minutes" || key === "assessment_window_minutes" ? 1 : 0} value={configuration[key]} onChange={(event) => update(key, Number(event.target.value))} />
                    </label>
                ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
                {(["teacher", "manager", "member"] as const).map((role) => (
                    <label key={role} className="text-sm text-app-muted">{role}, %
                        <Input type="number" min={0} max={100} value={configuration.weights[role]} onChange={(event) => update("weights", { ...configuration.weights, [role]: Number(event.target.value) })} />
                    </label>
                ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Причина изменения" className="min-w-60 flex-1" />
                <Button variant="outline" size="hug36" loading={saving} onClick={save}>Сохранить настройки</Button>
            </div>
            {published && <p className="text-xs text-app-muted">Для опубликованного экзамена дата начала и типы проектов не изменяются согласно backend-контракту.</p>}
        </div>
    );
};
