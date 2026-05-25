export type IdeaStatus = "new" | "planned" | "declined" | "implemented";

export type IdeaTag = {
    id: number;
    name: string;
    count: number;
};

export type IdeaAuthor = {
    id: number;
    username: string;
    avatarUrl: string;
};

export type IdeaComment = {
    id: number;
    author: IdeaAuthor;
    text: string;
    createdAt: string;
};

export type Idea = {
    id: number;
    title: string;
    description: string;
    votes: number;
    userVote: "up" | "down" | null;
    commentsCount: number;
    tags: string[];
    status: IdeaStatus;
    author: IdeaAuthor;
    createdAt: string;
};

export type IdeasSort = "newest" | "popular";
