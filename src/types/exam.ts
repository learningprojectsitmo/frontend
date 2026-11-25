export type ExamStatus = "draft" | "published";
export type ExamListStatus = ExamStatus | "archived";
export type RegistrationStatus = "active" | "cancelled" | "moved";
export type QueueState = "waiting" | "running" | "postponed" | "no_show" | "finished";
export type AttemptStatus = "speaking" | "questions" | "postponed" | "finished";

export type ExamWeights = {
    teacher: number;
    manager: number;
    member: number;
};

export type ExamConfiguration = {
    title: string;
    description: string | null;
    starts_at: string;
    connection_url: string | null;
    project_type_ids: number[];
    registration_opens_at: string | null;
    registration_closes_at: string | null;
    weights: ExamWeights;
    max_score: string | number;
    presentation_minutes: number;
    questions_minutes: number;
    transition_minutes: number;
    assessment_window_minutes: number;
};

export type Exam = {
    id: number;
    workspace_id: number;
    status: ExamStatus;
    current_settings_version: number;
    configuration: ExamConfiguration;
    created_by: number;
    created_at: string;
    published_by: number | null;
    published_at: string | null;
    completed_at?: string | null;
    archived_at?: string | null;
};

export type ExamListResponse = {
    items: Exam[];
    limit: number;
    offset: number;
    has_more: boolean;
};

export type ExamSettingsRevision = {
    exam_id: number;
    version: number;
    configuration: ExamConfiguration;
    changed_by: number;
    changed_at: string;
    reason: string | null;
};

export type ExamSettingsHistoryResponse = {
    items: ExamSettingsRevision[];
    limit: number;
    offset: number;
    has_more: boolean;
};

export type QuestionLevel = {
    score: 1 | 2 | 3 | 4 | 5;
    description: string;
};

export type ProjectTypeQuestion = {
    id: number;
    text: string;
    description: string | null;
    position: number;
    levels: QuestionLevel[];
};

export type QuestionScale = 3 | 5;

export type ProjectTypeQuestions = {
    etag?: string;
    project_type_id: number;
    questions: ProjectTypeQuestion[];
    min_score: 1;
    max_score: QuestionScale;
};

export type QuestionTemplate = {
    code: "product" | "technical_integration" | "research" | "project_defense";
    name: string;
    max_score: QuestionScale;
    questions: Omit<ProjectTypeQuestion, "id" | "position">[];
};

export type ExamSlot = {
    id: number;
    workspace_id: number;
    exam_id: number;
    starts_at: string;
    ends_at: string;
    kind?: "defense" | "break";
    can_edit?: boolean;
    can_delete?: boolean;
    is_available: boolean;
};

export type Registration = {
    id: number;
    workspace_id: number;
    exam_id: number;
    project_id: number;
    project_type_id_at_registration: number;
    slot_id: number | null;
    queue_position: number | null;
    queue_hold: "postponed" | "no_show" | null;
    status: RegistrationStatus;
    version: number;
    created_source: "manager" | "organizer";
    created_by: number;
    created_at: string;
    updated_by: number;
    updated_at: string;
    started_at: string | null;
};

export type RegistrationListResponse = {
    items: Registration[];
    limit: number;
    offset: number;
    has_more: boolean;
};

export type Attempt = {
    id: number;
    workspace_id: number;
    exam_id: number;
    registration_id: number;
    project_id: number;
    project_type_id: number;
    status: AttemptStatus;
    version: number;
    settings_version: number;
    started_at: string;
    phase_started_at: string;
    phase_deadline: string;
    paused_at: string | null;
    postponed_at: string | null;
    postponed_phase: "speaking" | "questions" | null;
    paused_seconds: number;
    finished_at: string | null;
    created_by: number;
    created_at: string;
    updated_at: string;
    remaining_seconds: number;
    server_now: string;
    assessment_window: {
        opened_at: string;
        closes_at: string;
        settings_version: number;
        project_type_id: number;
    } | null;
};

export type QueueItem = {
    registration_id: number;
    project_id: number;
    project_type_id: number;
    slot_id: number | null;
    planned_start_at: string | null;
    planned_end_at: string | null;
    position: number | null;
    state: QueueState;
    registration_version: number;
    started_at: string | null;
    attempt: Attempt | null;
};

export type ExamQueue = {
    queue_revision: number;
    server_now: string;
    settings_version: number;
    eta_stale: boolean;
    contract_version: number;
    items: QueueItem[];
    eta: {
        current: {
            registration_id: number;
            attempt_id: number;
            status: "speaking" | "questions";
            paused: boolean;
            phase_remaining_seconds: number;
            slot_remaining_seconds: number;
            overdue_seconds: number;
            settings_version: number;
        } | null;
        items: {
            registration_id: number;
            position: number;
            state: "waiting" | "postponed";
            eta_seconds: number;
            eta_at: string;
            certainty: "certain" | "lower_bound";
            reason: "paused" | "overdue" | "before_start" | null;
        }[];
    };
};
