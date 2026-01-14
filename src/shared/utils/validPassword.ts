export const isValidPassword = (password: string): boolean => {
    if (!password || typeof password !== "string") {
        return false;
    }

    const passwordRegex =
        /^(?=.*[a-zа-яё])(?=.*[A-ZА-ЯЁ])(?=.*\d)(?=.*[!@#$%^&*()_+=[\]{};':"|,.<>/?-]).{8,}$/;

    return passwordRegex.test(password);
};
