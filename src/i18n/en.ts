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
                invitation_cancelled:
                    "{{actor_name}} withdrew your invitation to project {{project_name}}",
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
            decorations: "Holiday decorations",
            decorationsDescription:
                "Show festive decorations (New Year, Halloween) when enabled by the administrator",
            decorationsSaved: "Setting saved",
            decorationsSaveError: "Failed to save the setting",
        },
        adminSettings: {
            title: "Site settings",
            subtitle: "Global options applied to every page",
            loadError: "Failed to load settings",
            saved: "Setting saved",
            saveError: "Failed to save the setting",
            flags: {
                new_year_decorations_enabled: {
                    title: "New Year decorations",
                    description: "Snow, garland and Christmas ornaments on every page",
                },
                halloween_decorations_enabled: {
                    title: "Halloween decorations",
                    description: "Cobwebs, bats and pumpkins on every page",
                },
            },
        },
        landing: {
            meta: {
                title: "Projects, teams and defense grading",
                description:
                    "EduFlow brings your projects, teams and tasks together: one filtered list, a kanban board with WIP limits, project defenses with slot booking, criteria-based grading and a results statement. Free.",
            },
            nav: {
                features: "Features",
                assessment: "Grading",
                howItWorks: "How it works",
                audience: "Who it is for",
                faq: "FAQ",
                login: "Log in",
                register: "Sign up",
                openApp: "Open the app",
                skipToContent: "Skip to content",
                menu: "Menu",
                toggleTheme: "Toggle theme",
            },
            language: {
                label: "Language",
                ru: "Русский",
                en: "English",
            },
            breadcrumb: {
                label: "Breadcrumb",
                home: "Home",
            },
            pages: {
                features: {
                    title: "EduFlow features",
                    description:
                        "Spaces, projects, a kanban board with WIP limits, specifications, wiki, roles and access rights — everything a team needs.",
                },
                assessment: {
                    title: "Exams and defense grading",
                    description:
                        "Exams with defense sign-up, queue and timers, criteria-based grading with role weights, result approval and a statement.",
                },
                howItWorks: {
                    title: "How EduFlow works",
                    description:
                        "Three steps: create a space, add projects and a team, and work on the board. No complex setup.",
                },
                audience: {
                    title: "Who EduFlow is for",
                    description:
                        "For team leads, student teams, research groups, product teams and hackathon organisers.",
                },
                faq: {
                    title: "EduFlow FAQ",
                    description:
                        "How much EduFlow costs, where data is stored, how a defense grade is calculated and other common questions.",
                },
            },
            hero: {
                badge: "Free · Data hosted in Russia",
                titleTop: "Twenty projects.",
                titleBottom: "One list.",
                subtitle:
                    "No more keeping twenty browser tabs open. EduFlow shows all your projects side by side — stage, progress, members and deadlines — with filters for the ones that matter right now.",
                primaryCta: "Try it for free",
                secondaryCta: "Log in",
                note: "Sign up in 30 seconds. No card required, no limit on the number of projects.",
                mockupLabel: "Space page with the project list",
            },
            mockup: {
                search: "Search projects",
                progressLabel: "Progress",
                membersLabel: "members",
                filterLabel: "Filters",
                gridLabel: "Cards",
                listLabel: "List",
                projectsTitle: "Projects",
                daysLeft_one: "{{count}} d.",
                daysLeft_other: "{{count}} d.",
                space: {
                    breadcrumb: "All spaces / Project management",
                    title: "Project management",
                    description: "Projects for planning, organising and controlling project work",
                    projectsCount: "8 projects",
                    membersCount: "24 members",
                    createProject: "Create project",
                    exams: "Space exams",
                },
                projects: [
                    {
                        title: "University Hackathon 2026",
                        description:
                            "<p>Applications, screening and team selection — all in one project.</p>",
                        tag: "planned",
                        status: "Planned",
                        progress: 15,
                        date: "Deadline: April 18, 2026",
                        stage: "Preparation",
                        tags: ["Hackathon", "University"],
                        members: 4,
                        people: ["Anna Kovaleva", "Maxim Volkov", "Timur Safin"],
                    },
                    {
                        title: "Website redesign",
                        description:
                            "<p>Refresh of the homepage and the courses section, moving content off the old CMS.</p>",
                        tag: "in_progress",
                        status: "In progress",
                        progress: 55,
                        date: "Deadline: February 12, 2026",
                        stage: "Design",
                        tags: ["Design", "Website"],
                        members: 3,
                        people: ["Anna Kovaleva", "Maxim Volkov", "Daria Litvinova"],
                    },
                    {
                        title: "Mobile app",
                        description:
                            "<p>Board, tasks and notifications in one app for the phone.</p>",
                        tag: "review",
                        status: "In review",
                        progress: 85,
                        date: "Deadline: February 28, 2026",
                        stage: "Development",
                        tags: ["Mobile", "Backend"],
                        members: 5,
                        people: [
                            "Maxim Volkov",
                            "Timur Safin",
                            "Daria Litvinova",
                            "Igor Novikov",
                            "Olga Eremina",
                        ],
                    },
                    {
                        title: "API v2.0",
                        description: "<p>Contract updates and a move to the new auth scheme.</p>",
                        tag: "completed",
                        status: "Completed",
                        progress: 100,
                        date: "Deadline: February 5, 2026",
                        stage: "Launch",
                        tags: ["API"],
                        members: 2,
                        people: ["Timur Safin", "Igor Novikov"],
                    },
                ],
                kanban: {
                    breadcrumb: "Projects / University Hackathon 2026 / Kanban",
                    columnsCount: "Total columns: {{count}}",
                    filterLabel: "All tasks",
                    quickAdd: "Add task...",
                    addColumn: "Add column",
                    columns: [
                        {
                            name: "Kanban",
                            color: "blue",
                            tasks: [
                                {
                                    title: "Collect application requirements",
                                    priority: "medium",
                                    dueInDays: 6,
                                    tags: ["Docs"],
                                    people: ["Anna Kovaleva"],
                                },
                                {
                                    title: "Approve the spec with the committee",
                                    priority: "high",
                                    dueInDays: 2,
                                    tags: ["Spec"],
                                    people: ["Maxim Volkov", "Daria Litvinova"],
                                    subtasks: [
                                        { title: "Draft spec", done: true },
                                        { title: "Committee review", done: false },
                                    ],
                                },
                            ],
                        },
                        {
                            name: "In progress",
                            color: "yellow",
                            tasks: [
                                {
                                    title: "Team registration form",
                                    priority: "urgent",
                                    dueInDays: -1,
                                    tags: ["Frontend", "Design"],
                                    people: ["Timur Safin", "Olga Eremina"],
                                },
                                {
                                    title: "Project list screen",
                                    priority: "default",
                                    dueInDays: 5,
                                    tags: ["Frontend"],
                                    people: ["Olga Eremina"],
                                },
                            ],
                        },
                        {
                            name: "Done",
                            color: "green",
                            tasks: [
                                {
                                    title: "Roles and access for the jury",
                                    priority: "low",
                                    tags: ["Backend"],
                                    people: ["Igor Novikov"],
                                },
                            ],
                        },
                    ],
                },
            },
            problems: {
                title: "What usually goes wrong",
                subtitle: "Three situations that make project work fall apart",
                items: [
                    {
                        title: "Twenty tabs and no overview",
                        description:
                            "One project lives in one window, its tasks in another, the team roster in a third. Keeping all of it in your head is not realistic.",
                    },
                    {
                        title: "Who is doing what — we ask in chat",
                        description:
                            "Only the person doing the task knows its status. A board with roles and access rights gives you the answer immediately.",
                    },
                    {
                        title: "Nobody remembers why we decided this way",
                        description:
                            "A month later no one can explain when or by whom the requirements changed or the deadline moved.",
                    },
                ],
            },
            howItWorks: {
                title: "How it works",
                subtitle: "Three steps from sign-up to a working board",
                steps: [
                    {
                        title: "Create a space",
                        description:
                            "A space is a container for projects sharing an interest or a field. One for a study group, another for your day job.",
                    },
                    {
                        title: "Add projects and people",
                        description:
                            "Describe the project, attach a type with stages, invite members by link and assign roles.",
                    },
                    {
                        title: "Work on the board",
                        description:
                            "Tasks, subtasks, priorities and WIP limits on a kanban board. The specification and the wiki live next to the project.",
                    },
                ],
            },
            features: {
                title: "Everything you need to run projects",
                subtitle: "No overpromising: only what the product actually does",
                groups: [
                    {
                        title: "Team",
                        icon: "members",
                        items: [
                            "Spaces by interest and field",
                            "Search for projects and people in one box",
                            "Invitations by link and applications to join",
                            "Roles and access rights down to project level",
                        ],
                    },
                    {
                        title: "Work",
                        icon: "list",
                        items: [
                            "Kanban board with drag-and-drop cards",
                            "WIP limits per column, priorities, subtasks",
                            "Specification with requirement groups and approval",
                            "Project wiki",
                        ],
                    },
                    {
                        title: "Control",
                        icon: "filter",
                        items: [
                            "One list of every project, with filters",
                            "Filter by stage, tag, member and due date",
                            "Notifications about events from every project",
                            "Change history and action audit",
                        ],
                    },
                    {
                        title: "Defenses and grading",
                        icon: "exam",
                        items: [
                            "Exams with a date, project types and criteria",
                            "Team sign-up for defense slots and slot management",
                            "Defense queue with timers and ETA",
                            "Criteria-based grading, role weights and a results statement",
                        ],
                    },
                ],
                kanbanLabel: "Project kanban board with columns and tasks",
            },
            assessment: {
                badge: "New",
                title: "Exams and grading — from sign-up to the statement",
                subtitle:
                    "Teams book a defense slot, the host runs the queue and timers, and teachers, managers and participants score against criteria. The service calculates a weighted result, and the organiser approves and publishes it.",
                steps: [
                    {
                        title: "Sign-up and slots",
                        description:
                            "Teams book a defense slot themselves or through the organiser. Slots can be moved or cancelled, and every booking stays in the exam history.",
                    },
                    {
                        title: "Queue and timers",
                        description:
                            "A defense queue with estimated times: presentation, questions, transition and grading each run on their own timer.",
                    },
                    {
                        title: "Grading",
                        description:
                            "Criteria come from the project type: a 1–3 or 1–5 scale and a comment for every score. Drafts save automatically and the window closes at the deadline.",
                    },
                    {
                        title: "Results and statement",
                        description:
                            "A weighted score by role, a manual adjustment with a reason, published results and a statement export to CSV.",
                    },
                ],
                mockupLabel: "Exam page with the presentation queue and grading",
                mockup: {
                    window: "eduflow.app/app/exams",
                    tag: "Course project",
                    breadcrumb: "All spaces / Exams / Project defense",
                    examTitle: "Course project defense",
                    examStatus: "Live",
                    startExam: "Start exam",
                    connect: "Join",
                    discipline: "Exam for students of «Project management · Year 3»",
                    period: "Defense period Apr 18, 10:00 — 12:30",
                    spaceMeta: "Space «Project management» · Created Apr 12",
                    descriptionTitle: "Exam description",
                    description: "A check of students' preparation and project work.",
                    upcomingTitle: "Preparing to present",
                    teamNumber: "1",
                    projectName: "IT test case",
                    projectDescription: "An automatic test-checking service with explanations.",
                    leaderLabel: "Supervisor:",
                    leader: "Elena Sokolova",
                    teamLabel: "Team:",
                    team: "Ivan Petrov, Maria Lebedeva, Oleg Smirnov",
                    previous: "Previous team",
                    next: "Next team",
                    timerTitle: "Timer",
                    timerDuration: "Stage duration 07:00",
                    timerValue: "07:00",
                    timerStatus: "Waiting to start",
                    forecastTitle: "Estimated finish",
                    forecastCurrentLabel: "Team finish",
                    forecastQueueLabel: "Queue finish",
                    forecastCurrent: "12:30",
                    forecastQueue: "19:44",
                    queueTitle: "Presentation order",
                    assign: "Assign team",
                    search: "Search teams",
                    filter: "All teams",
                    tableHeaders: ["#", "Project", "Supervisor", "Team", "Time", "Score"],
                    rows: [
                        {
                            number: "1",
                            project: "IT test case",
                            source: "Assigned by organiser",
                            leader: "Elena Sokolova",
                            team: ["ES", "ML", "AS"],
                            time: "12:00",
                            slot: "12:00",
                            score: "23.65",
                            state: "score",
                        },
                        {
                            number: "2",
                            project: "Multilingual case",
                            source: "Booked by the team",
                            leader: "Viktor Maksimov",
                            team: ["VM", "EK", "DL"],
                            time: "12:20",
                            slot: "12:20",
                            score: "Score",
                            state: "action",
                        },
                        {
                            number: "3",
                            project: "Solution generation ideas",
                            source: "Assigned by organiser",
                            leader: "Vladislav Zotov",
                            team: ["VZ", "AS", "AK"],
                            time: "12:45",
                            slot: "12:30",
                            score: "",
                            state: "waiting",
                        },
                        {
                            number: "—",
                            project: "Break",
                            source: "",
                            leader: "—",
                            team: [],
                            time: "14:20–15:00",
                            slot: "",
                            score: "",
                            state: "break",
                        },
                        {
                            number: "4",
                            project: "Smart cart",
                            source: "Booked by the team",
                            leader: "Roman Tkachenko",
                            team: ["RT", "AK", "IM"],
                            time: "13:00",
                            slot: "12:50",
                            score: "",
                            state: "waiting",
                        },
                    ],
                    statement: "Exam statement",
                    toastTitle: "Score the team in the table",
                    toastCountdown: "Closes in 4:32",
                    scoreAction: "Score",
                    scorePending: "Closes in 4:32",
                    slotLabel: "Slot",
                },
            },
            audience: {
                title: "Who it is built for",
                subtitle: "If you have more than one project running",
                items: [
                    {
                        icon: "sidebar",
                        title: "People leading work",
                        description:
                            "When you need to hold the status of several projects and their deadlines in your head, not just one.",
                    },
                    {
                        icon: "university",
                        title: "Student teams",
                        description:
                            "Course and diploma projects with distributed roles and requirements that need approval.",
                    },
                    {
                        icon: "magnifier",
                        title: "Research groups",
                        description:
                            "When members are in different cities and the shared picture matters.",
                    },
                    {
                        icon: "rocket",
                        title: "Product teams",
                        description:
                            "A board, stages and a decision log instead of a thread in a messenger.",
                    },
                    {
                        icon: "calendar",
                        title: "Hackathon organisers",
                        description:
                            "One project per hackathon: teams on the board, jury and participant roles, defense sign-up and criteria-based grading.",
                    },
                ],
            },
            faq: {
                title: "Frequently asked questions",
                subtitle: "About pricing, data, teams, boards and defense grading.",
                searchLabel: "Search questions",
                searchPlaceholder: "Find a question…",
                all: "All",
                emptyTitle: "Nothing found",
                emptyDescription: "Try a different query or category.",
                ctaTitle: "Still have a question?",
                ctaDescription: "Create an account and see how EduFlow works with your projects.",
                ctaButton: "Try it for free",
                categories: {
                    general: "General",
                    projects: "Projects and teams",
                    grading: "Exams and grading",
                    data: "Data and access",
                },
                items: [
                    {
                        question: "What is EduFlow?",
                        answer: "EduFlow is a workspace for project work: one list of projects, teams, a kanban board, specifications, wiki and exams with grading in one place.",
                    },
                    {
                        question: "How much does EduFlow cost?",
                        answer: "The service is free. There are no plans to pay for and no limit on the number of projects or members.",
                    },
                    {
                        question: "Can I work without a team?",
                        answer: "Yes. You can create a project and run the board alone, and invite members later.",
                    },
                    {
                        question: "What are spaces for?",
                        answer: "A space groups projects by field or interest: a study group, a work unit, a hackathon. Projects, members and access settings live inside it.",
                    },
                    {
                        question: "How do I invite members?",
                        answer: "Send an invitation link or accept an application to the project. Roles and access rights are assigned at the project level.",
                    },
                    {
                        question: "What can I track on the board?",
                        answer: "Tasks with priorities, deadlines, tags, subtasks and assignees. Cards drag between columns, and WIP limits keep a stage from being overloaded.",
                    },
                    {
                        question: "Where do requirements and rules live?",
                        answer: "A specification with requirement groups and approval sits next to the project. Rules, regulations and notes fit in the project wiki.",
                    },
                    {
                        question: "Can we run a hackathon or project defense?",
                        answer: "Yes. Defenses use exams: teams book slots, the host runs the queue and timers, and the jury scores projects against criteria. Results are collected in a statement and can be exported as CSV.",
                    },
                    {
                        question: "How is the final grade calculated?",
                        answer: "Teachers, managers and participants score against the criteria. The service averages each group and combines them using the configured weights. The organiser approves the calculated result or adjusts it manually with a reason and publishes it.",
                    },
                    {
                        question: "Who can score a team?",
                        answer: "Teachers and space admins score every team. Managers and participants score other teams but not their own — that exclusion is fixed when the grading window opens.",
                    },
                    {
                        question: "What happens after a defense?",
                        answer: "A grading window opens with a criteria form. Answers save to a draft, and after submission and the window closes the organiser can approve and publish the result.",
                    },
                    {
                        question: "Where is the data stored?",
                        answer: "The data is hosted on a server in Russia.",
                    },
                    {
                        question: "How do roles and access rights work?",
                        answer: "Roles and rights are assigned at the space and project level: who can view, edit and manage. This limits access to settings, the board and grading.",
                    },
                    {
                        question: "Is there a change history?",
                        answer: "Yes. Each project keeps changes and an action audit, and notifications collect events from every project.",
                    },
                ],
            },
            finalCta: {
                title: "One list instead of twenty tabs",
                description:
                    "Create an account, add your projects and see how they look side by side.",
                button: "Try it for free",
            },
            footer: {
                tagline: "A workspace for running projects",
                product: "Product",
                legal: "Legal",
                privacy: "Privacy policy",
                cookies: "Cookie settings",
                rights: "All rights reserved.",
            },
        },
    },
};

export default en;
