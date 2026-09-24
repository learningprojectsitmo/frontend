const en = {
    translation: {
        notifications: {
            title: "Notifications",
            markAllRead: "Mark all as read",
            showAll: "Show all",
            empty: "No notifications",
            tabs: {
                all: "All",
                responses: "Responses",
                invitations: "Invitations",
                approvals: "Approvals",
                tasks: "Tasks",
                archive: "Archive",
            },
            types: {
                response_received: "{{actor_name}} applied to project {{project_name}}",
                response_accepted:
                    "{{actor_name}} accepted your response to project {{project_name}}",
                response_rejected:
                    "{{actor_name}} rejected your response to project {{project_name}}",
                response_confirmed:
                    "{{actor_name}} confirmed participation in project {{project_name}}",
                invitation_received: "{{actor_name}} invites you to project {{project_name}}",
                invitation_accepted:
                    "{{actor_name}} accepted invitation to project {{project_name}}",
                invitation_rejected:
                    "{{actor_name}} rejected invitation to project {{project_name}}",
                stage_approval_required:
                    "{{actor_name}} requested approval of stage «{{stage_name}}» in project {{project_name}}",
                task_created:
                    "{{actor_name}} created task «{{task_title}}» in project {{project_name}}",
                task_updated:
                    "{{actor_name}} updated task «{{task_title}}» in project {{project_name}}",
                task_moved:
                    "{{actor_name}} moved task «{{task_title}}» to column «{{column_name}}» in project {{project_name}}",
                task_deleted:
                    "{{actor_name}} deleted task «{{task_title}}» from project {{project_name}}",
                subtask_created:
                    "{{actor_name}} added subtask «{{subtask_title}}» to task «{{task_title}}» in project {{project_name}}",
                subtask_updated:
                    "{{actor_name}} updated subtask «{{subtask_title}}» of task «{{task_title}}» in project {{project_name}}",
                subtask_deleted:
                    "{{actor_name}} deleted subtask «{{subtask_title}}» from task «{{task_title}}» in project {{project_name}}",
            },
            time: {
                justNow: "just now",
                minutesAgo: "{{minutes}} min ago",
                hoursAgo: "{{hours}} h ago",
                daysAgo: "{{days}} d ago",
            },
        },
        settings: {
            language: "Language",
            languageDescription: "Choose the interface language",
            saved: "Language saved",
            saveError: "Failed to save language",
        },
    },
};

export default en;
