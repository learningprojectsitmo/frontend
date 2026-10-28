// @vitest-environment jsdom
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ProfileHeader } from "./profile-header";

function renderContact(label: string, value: string) {
    const container = document.createElement("div");
    container.innerHTML = renderToStaticMarkup(
        <ProfileHeader
            fullName="Иван Иванов"
            initials="ИИ"
            role={null}
            email={null}
            phone={null}
            socials={[{ label, value }]}
        />,
    );
    return container;
}

describe("ProfileHeader: ссылки на соцсети", () => {
    it.each([
        ["Telegram", "@student_name", "https://t.me/student_name"],
        ["Telegram", "student_name", "https://t.me/student_name"],
        ["Telegram", " https://t.me/student_name ", "https://t.me/student_name"],
        ["VK", "@student_name", "https://vk.com/student_name"],
        ["VK", "@student-name", "https://vk.com/student-name"],
        ["VK", "https://vk.com/student-name", "https://vk.com/student-name"],
        ["VK", "student.name", "https://vk.com/student.name"],
        ["VK", "https://vk.com/id123456", "https://vk.com/id123456"],
        ["VK", "http://www.vk.com/student_name/", "https://vk.com/student_name"],
        ["VK", "vk.com/student_name", "https://vk.com/student_name"],
        ["VK", "https://m.vk.com/student_name?from=profile", "https://vk.com/student_name"],
    ])("%s: %s открывает нужный профиль в новой вкладке", (label, value, href) => {
        const link = renderContact(label, value).querySelector("a");
        expect(link?.getAttribute("href")).toBe(href);
        expect(link?.getAttribute("target")).toBe("_blank");
        expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
        expect(link?.textContent).toBe(value);
    });

    it.each([
        ["VK", "javascript:alert(1)"],
        ["VK", "https://example.com/student"],
        ["VK", "https://vk.com.example.com/student"],
        ["VK", "https://vk.com@example.com/student"],
        ["VK", "https://user:password@vk.com/student"],
        ["VK", "https://vk.com/"],
        ["VK", "https://vk.com/student/messages"],
        ["VK", "имя с пробелами"],
        ["Telegram", "https://example.com/student_name"],
        ["Telegram", "@"],
        ["Other", "@student_name"],
    ])("%s: некорректный адрес %s остаётся текстом", (label, value) => {
        const container = renderContact(label, value);
        expect(container.querySelector("a")).toBeNull();
        expect(container.textContent).toContain(value);
    });

    it("не создаёт ссылку для пустого контакта", () => {
        expect(renderContact("VK", "   ").querySelector("a")).toBeNull();
    });
});
