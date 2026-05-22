import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioOption {
    value: string;
    label: string;
    description?: string;
}

interface RadioGroupProps {
    options: RadioOption[];
    value: string;
    onValueChange: (value: string) => void;
    name?: string;
    className?: string;
}

export const RadioGroup = ({ options, value, onValueChange, name, className }: RadioGroupProps) => {
    return (
        <div className={cn("flex flex-col gap-2", className)}>
            {options.map((option) => (
                <label
                    key={option.value}
                    className={cn(
                        "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                        value === option.value
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 bg-white hover:border-gray-300",
                    )}
                >
                    <input
                        type="radio"
                        name={name}
                        value={option.value}
                        checked={value === option.value}
                        onChange={() => onValueChange(option.value)}
                        className="mt-0.5 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{option.label}</span>
                        {option.description && (
                            <span className="text-xs text-gray-500">{option.description}</span>
                        )}
                    </div>
                </label>
            ))}
        </div>
    );
};
