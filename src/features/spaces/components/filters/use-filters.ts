import { useState, useMemo, useCallback } from "react";
import type { ProjectListItemResponse } from "@/types/api";
import type { FiltersState } from "./types";
import { defaultFiltersState } from "./types";

function isWithinDays(date: Date, days: number): boolean {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function matchesDateFilter(deadline: string | null, state: FiltersState): boolean {
    if (state.datePreset === "all") return true;
    if (!deadline) return false;

    const d = new Date(deadline);

    switch (state.datePreset) {
        case "today":
            return isSameDay(d, new Date());
        case "7days":
            return isWithinDays(d, 7);
        case "30days":
            return isWithinDays(d, 30);
        case "custom":
            if (!state.customDate) return true;
            return d >= state.customDate.from && d <= state.customDate.to;
        default:
            return true;
    }
}

export function useFilters(projects: ProjectListItemResponse[]) {
    const [state, setState] = useState<FiltersState>(defaultFiltersState);

    const availableStatuses = useMemo(() => {
        const set = new Set<string>();
        for (const p of projects) {
            const name = p.status?.name || "draft";
            set.add(name);
        }
        return [...set].sort();
    }, [projects]);

    const availableTags = useMemo(() => {
        const set = new Set<string>();
        for (const p of projects) {
            for (const t of p.tags) {
                set.add(t);
            }
        }
        return [...set].sort((a, b) => a.localeCompare(b, "ru"));
    }, [projects]);

    const availableMembers = useMemo(() => {
        const map = new Map<number, { id: number; full_name: string }>();
        for (const p of projects) {
            for (const m of p.participants_preview) {
                if (!map.has(m.id)) {
                    map.set(m.id, { id: m.id, full_name: m.full_name });
                }
            }
        }
        return [...map.values()].sort((a, b) => a.full_name.localeCompare(b.full_name, "ru"));
    }, [projects]);

    const activeCount = useMemo(() => {
        let count = 0;
        if (state.statuses.length > 0) count++;
        if (state.tags.length > 0) count++;
        if (state.members.length > 0) count++;
        if (state.datePreset !== "all") count++;
        return count;
    }, [state]);

    const filteredProjects = useMemo(() => {
        let result = projects;

        if (state.statuses.length > 0) {
            result = result.filter((p) => p.status?.name && state.statuses.includes(p.status.name));
        }

        if (state.tags.length > 0) {
            result = result.filter((p) => p.tags.some((t) => state.tags.includes(t)));
        }

        if (state.members.length > 0) {
            result = result.filter((p) =>
                p.participants_preview.some((m) => state.members.includes(m.id)),
            );
        }

        if (state.datePreset !== "all") {
            result = result.filter((p) => matchesDateFilter(p.deadline, state));
        }

        return result;
    }, [projects, state]);

    const resetFilters = useCallback(() => {
        setState(defaultFiltersState);
    }, []);

    const setFilterField = useCallback(
        <K extends keyof FiltersState>(field: K, value: FiltersState[K]) => {
            setState((prev) => ({ ...prev, [field]: value }));
        },
        [],
    );

    return {
        state,
        setState,
        setFilterField,
        resetFilters,
        filteredProjects,
        activeCount,
        availableStatuses,
        availableTags,
        availableMembers,
    };
}
