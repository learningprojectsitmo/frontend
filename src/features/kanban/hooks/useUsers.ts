import { useQuery } from "@tanstack/react-query";
import { kanbanApi } from "@/lib/api-kanban";

export const useUsers = () => {
    return useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const response = await kanbanApi.getAllUsers();
            const items = response.items || [];

            return items.map((user) => ({
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
            }));
        },
    });
};

// Todo тут все пользователи, а нужны участники проекта
