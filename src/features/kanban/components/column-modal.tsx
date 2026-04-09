import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { allColorValues, baseColor, columnColors } from "../utils/column-styles";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const colorEnum = z.enum(allColorValues as [string, ...string[]]);

const columnSchema = z.object({
    name: z.string().min(1, "Название обязательно").max(50, "Слишком длинное название"),
    color: colorEnum.default("white"),
    wipLimit: z.preprocess((val) => {
        if (val === "" || val === null || val === undefined) return undefined;
        const num = Number(val);
        return isNaN(num) ? undefined : num;
    }, z.number().int().min(1).optional()),
});

type ColumnFormData = z.infer<typeof columnSchema>;

interface ColumnModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ColumnFormData) => void;
    projectId: number;
    isLoading?: boolean;
}

export const ColumnModal: React.FC<ColumnModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isLoading = false,
}) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm<ColumnFormData>({
        resolver: zodResolver(columnSchema),
        defaultValues: {
            name: "",
            color: "white",
            wipLimit: undefined,
        },
    });

    const selectedColor = watch("color");

    React.useEffect(() => {
        if (isOpen) {
            reset();
        }
    }, [isOpen, reset]);

    const handleFormSubmit = (data: ColumnFormData) => {
        const processedData: ColumnFormData = {
            name: data.name,
            color: data.color,
        };

        if (data.wipLimit && data.wipLimit > 0) {
            processedData.wipLimit = Number(data.wipLimit);
        }

        onSubmit(processedData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Создать колонку</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    {/* Название */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Название колонки *</Label>
                        <Input
                            id="name"
                            {...register("name")}
                            placeholder="Например: To Do, In Progress, Done"
                            error={!!errors.name}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Цвет */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <Label>Цвет колонки</Label>
                            </div>
                            <button
                                type="button"
                                onClick={() => setValue("color", "white")}
                                className={cn(
                                    "w-8 h-8 rounded-full transition-all",
                                    baseColor.white.header,
                                    "border border-gray-300",
                                    selectedColor === "white" &&
                                        "ring-2 ring-blue-500 ring-offset-1",
                                )}
                                title="Белый"
                                aria-label="Белый цвет"
                            />
                        </div>
                        <div className="grid grid-cols-7 gap-5">
                            {Object.entries(columnColors).map(([colorName, styles]) => (
                                <button
                                    key={colorName}
                                    type="button"
                                    onClick={() =>
                                        setValue("color", colorName as ColumnFormData["color"])
                                    }
                                    className={cn(
                                        "w-full aspect-square rounded-full transition-all",
                                        "hover:scale-110 hover:shadow-md",
                                        styles.header,
                                        selectedColor === colorName &&
                                            "ring-2 ring-blue-500 ring-offset-1",
                                    )}
                                    title={styles.label || colorName}
                                    aria-label={`Цвет ${styles.label || colorName}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* WIP Limit */}
                    <div className="space-y-2">
                        <Label htmlFor="wipLimit">Лимит задач (WIP)</Label>
                        <Input
                            id="wipLimit"
                            type="number"
                            {...register("wipLimit")}
                            placeholder="Например: 5"
                        />
                        <p className="text-xs text-gray-500">
                            Максимальное количество задач в колонке (оставьте пустым для безлимита)
                        </p>
                    </div>

                    {/* Кнопки */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" size="hug36" onClick={onClose}>
                            Отмена
                        </Button>
                        <Button type="submit" variant="blue" size="hug36" disabled={isLoading}>
                            {isLoading ? "Создание..." : "Создать колонку"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
