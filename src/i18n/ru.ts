const ru = {
    translation: {
        notifications: {
            title: "Уведомления",
            markAllRead: "Пометить все как прочитанные",
            showAll: "Показать все",
            empty: "Нет уведомлений",
            tabs: {
                all: "Все",
                responses: "Отклики",
                invitations: "Приглашения",
                approvals: "Утверждения",
                tasks: "Задачи",
                archive: "Архив",
            },
            types: {
                response_received: "{{actor_name}} откликнулся на проект {{project_name}}",
                response_accepted: "{{actor_name}} принял ваш отклик на проект {{project_name}}",
                response_rejected: "{{actor_name}} отклонил ваш отклик на проект {{project_name}}",
                response_confirmed: "{{actor_name}} подтвердил участие в проекте {{project_name}}",
                invitation_received: "{{actor_name}} приглашает вас в проект {{project_name}}",
                invitation_accepted: "{{actor_name}} принял приглашение в проект {{project_name}}",
                invitation_rejected:
                    "{{actor_name}} отклонил приглашение в проект {{project_name}}",
                stage_approval_required:
                    "{{actor_name}} запросил утверждение этапа «{{stage_name}}» в проекте {{project_name}}",
                task_created:
                    "{{actor_name}} создал задачу «{{task_title}}» в проекте {{project_name}}",
                task_updated:
                    "{{actor_name}} обновил задачу «{{task_title}}» в проекте {{project_name}}",
                task_moved:
                    "{{actor_name}} переместил задачу «{{task_title}}» в колонку «{{column_name}}» проекта {{project_name}}",
                task_deleted:
                    "{{actor_name}} удалил задачу «{{task_title}}» из проекта {{project_name}}",
                subtask_created:
                    "{{actor_name}} добавил подзадачу «{{subtask_title}}» в задачу «{{task_title}}» проекта {{project_name}}",
                subtask_updated:
                    "{{actor_name}} обновил подзадачу «{{subtask_title}}» задачи «{{task_title}}» проекта {{project_name}}",
                subtask_deleted:
                    "{{actor_name}} удалил подзадачу «{{subtask_title}}» из задачи «{{task_title}}» проекта {{project_name}}",
            },
            time: {
                justNow: "только что",
                minutesAgo: "{{minutes}} мин. назад",
                hoursAgo: "{{hours}} ч. назад",
                daysAgo: "{{days}} д. назад",
            },
        },
        settings: {
            language: "Язык",
            languageDescription: "Выберите язык интерфейса",
            saved: "Язык сохранён",
            saveError: "Не удалось сохранить язык",
        },
    },
};

export default ru;
