// features/settings/components/role-select.tsx
import * as React from "react";
import { cn } from "@/lib/utils.ts";
import { Icon } from "@/components/ui/icons";
import type { Role } from "../types";

interface RoleSelectProps {
    roles: Role[];
    selectedRoleId: string;
    onRoleChange: (roleId: string) => void;
    className?: string;
}

export const RoleSelect = ({ roles, selectedRoleId, onRoleChange, className }: RoleSelectProps) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const selectedRole = roles.find((r) => r.id === selectedRoleId);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={cn("relative w-64", className)} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-2 bg-white border border-[--color-black-10] rounded-lg text-[15px] text-[--grey-4] hover:bg-[--grey-96] transition-colors"
            >
                <span>{selectedRole?.name || "Выберите роль"}</span>
                <Icon
                    name="arrow-down"
                    size={16}
                    className={cn("transition-transform", isOpen && "rotate-180")}
                />
            </button>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-[--color-black-10] rounded-lg shadow-lg overflow-hidden">
                    {roles.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => {
                                onRoleChange(role.id);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "w-full text-left px-4 py-2 text-[15px] hover:bg-[--grey-96] transition-colors",
                                role.id === selectedRoleId
                                    ? "bg-[--grey-96] font-medium"
                                    : "text-[--grey-4]",
                            )}
                        >
                            <div className="flex justify-between items-center">
                                <span>{role.name}</span>
                                <span className="text-[13px] text-[--azure-46]">
                                    {role.userCount} чел.
                                </span>
                            </div>
                            <span className="text-[13px] text-[--azure-46] block mt-0.5">
                                {role.description}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
