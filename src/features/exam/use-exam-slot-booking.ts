import { canBookExamSlot, getSlotInterval } from "./exam-schedule";
import { useRef, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useUser } from "@/lib/auth";
import {
    examApi,
    getExamErrorCode,
    getExamErrorMessage,
    invalidateExam,
    useExamBlockedProjects,
    useExamRegistrations,
    useExamSlots,
} from "@/lib/exams";
import { getCreatedProjects, getProject } from "@/lib/projects";
import { queryKeys } from "@/lib/query-keys";
import type { Exam, ExamQueue, ExamSlot, Registration } from "@/types/exam";
import { isExamRegistrationOpen } from "./exam-display";

type BookingAction =
    | { kind: "book"; slot: ExamSlot | null; projectId: number }
    | { kind: "cancel"; registration: Registration };

export function useExamSlotBooking(
    workspaceId: number,
    examId: number,
    exam: Exam | undefined,
    now: number,
    enabled: boolean,
    queue?: ExamQueue,
) {
    const user = useUser();
    const client = useQueryClient();
    const confirming = useRef(false);
    const [selecting, setSelecting] = useState(false);
    const [projectId, setProjectId] = useState<number>();
    const [action, setAction] = useState<BookingAction | null>(null);
    const slots = useExamSlots(workspaceId, examId, enabled, selecting ? 5000 : undefined);
    const registrations = useExamRegistrations(workspaceId, examId, true, enabled);
    const myProjects = useQuery({
        queryKey: [...queryKeys.profile.createdProjects(), "exam-booking", user.data?.id],
        queryFn: getCreatedProjects,
        enabled: enabled && Boolean(user.data?.id),
    });
    const projects = useQueries({
        queries: (enabled ? (myProjects.data?.items ?? []) : []).map(({ id }) => ({
            queryKey: queryKeys.project.detail(id),
            queryFn: () => getProject(String(id)),
        })),
    });

    const isOpen = Boolean(exam && isExamRegistrationOpen(exam, now, queue));
    const availability = useExamBlockedProjects(workspaceId, examId, true, enabled && isOpen);

    const active = registrations.data?.items.filter((item) => item.status === "active") ?? [];
    const eligible = projects.flatMap(({ data, isSuccess }) =>
        isSuccess &&
        data &&
        data.author_id === user.data?.id &&
        data.workspace_id === workspaceId &&
        data.project_type_id !== null &&
        exam?.configuration.project_type_ids.includes(data.project_type_id)
            ? [data]
            : [],
    );
    const blockedIds = new Set(availability.data);
    const currentIds = new Set(active.map((registration) => registration.project_id));
    const bookableProjects = eligible.filter((project) => !blockedIds.has(project.id));
    const selected =
        bookableProjects.find((project) => project.id === projectId) ?? bookableProjects[0];
    const loading =
        slots.isPending ||
        registrations.isPending ||
        myProjects.isPending ||
        (isOpen && availability.isPending) ||
        projects.some((query) => query.isPending);
    const error =
        slots.isError ||
        registrations.isError ||
        myProjects.isError ||
        (isOpen && availability.isError) ||
        (eligible.length === 0 && projects.some((query) => query.isError));
    const canBook = enabled && isOpen && !loading && !error && Boolean(selected);
    const canCancel = (registration: Registration) =>
        enabled &&
        isOpen &&
        !registrations.isError &&
        !registration.started_at &&
        eligible.some((project) => project.id === registration.project_id);
    const available = slots.data?.items.filter((slot) => slot.kind !== "break") ?? [];
    const inMode = selecting && canBook;
    const selectedSlot = action?.kind === "book" ? action.slot : null;
    const selectedSlotCurrent =
        selectedSlot && available.some((slot) => canBookExamSlot(slot, selectedSlot));
    const canConfirm =
        action?.kind === "book"
            ? inMode &&
              bookableProjects.some((project) => project.id === action.projectId) &&
              (action.slot ? selectedSlotCurrent : available.length === 0)
            : action?.kind === "cancel" &&
              active.some(
                  (item) =>
                      item.id === action.registration.id &&
                      item.version === action.registration.version &&
                      canCancel(item),
              );

    const mutation = useMutation({
        mutationFn: (target: BookingAction) =>
            target.kind === "book"
                ? examApi.register(
                      workspaceId,
                      examId,
                      {
                          project_id: target.projectId,
                          slot_id: target.slot?.id ?? null,
                          ...(target.slot && {
                              expected_slot: getSlotInterval(target.slot),
                          }),
                      },
                      true,
                  )
                : examApi.cancelRegistration(
                      workspaceId,
                      examId,
                      target.registration.id,
                      target.registration.version,
                      "Команда отменила запись",
                      true,
                  ),
        onSettled: () => {
            confirming.current = false;
        },
        onSuccess: async (_, target) => {
            await invalidateExam(client, workspaceId, examId);
            setSelecting(false);
            setAction(null);
            toast.success(
                target.kind === "book" ? "Команда записана на защиту" : "Запись на защиту отменена",
            );
        },
        onError: async (failure, target) => {
            toast.error(
                getExamErrorCode(failure) === "slot_unavailable"
                    ? "Этот слот уже заняли. Выберите другое время."
                    : (getExamErrorMessage(failure) ??
                          (target.kind === "book"
                              ? "Не удалось записаться на защиту. Попробуйте ещё раз."
                              : "Не удалось отменить запись. Попробуйте ещё раз.")),
            );
            await invalidateExam(client, workspaceId, examId);
            setAction(null);
        },
    });

    return {
        active,
        available,
        eligible,
        bookableProjects,
        hasOtherBooking: eligible.some(
            (project) => blockedIds.has(project.id) && !currentIds.has(project.id),
        ),
        selected,
        isOpen,
        loading,
        error,
        canBook,
        canCancel,
        inMode,
        action,
        canConfirm,
        pending: mutation.isPending,
        setSelecting,
        setProjectId,
        selectSlot: (slot: ExamSlot) => {
            if (inMode && selected && slot.is_available)
                setAction({ kind: "book", slot, projectId: selected.id });
        },
        bookWithoutSlot: () => {
            if (inMode && selected && available.length === 0)
                setAction({ kind: "book", slot: null, projectId: selected.id });
        },
        selectCancellation: (registration: Registration) =>
            setAction({ kind: "cancel", registration }),
        dismiss: () => {
            if (!mutation.isPending) setAction(null);
        },
        confirm: () => {
            if (!action || !canConfirm || confirming.current) return;
            confirming.current = true;
            mutation.mutate(action);
        },
    };
}
