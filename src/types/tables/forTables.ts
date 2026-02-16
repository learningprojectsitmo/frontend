export interface Member {
    id: string
    name: string
    role: string
    priority: number
    contacts: string
    resumeUrl: string
    dateAdded: string
    responseDate: string
    avatarUrl?: string

}

export interface Role {
    nameRole: string
    responsibilities: string[]
    numberOfMembers: number
}

export interface Platform {
    name: string
    description: string
    status: string
    progressInPercent: number
    due: string
    tags: string[]
    members: number
}