import { Icon } from "@/components/ui/icons";

type SocialContactProps = { label: string; value: string };

function getProfileUrl(label: string, value: string): string | null {
    const platform = label.toLowerCase();
    if (platform !== "telegram" && platform !== "vk") return null;

    const hosts = platform === "telegram" ? ["t.me"] : ["vk.com", "www.vk.com", "m.vk.com"];
    const nicknamePattern = platform === "telegram" ? /^[a-zA-Z0-9_]{5,32}$/ : /^[a-zA-Z0-9_.-]+$/;
    const contact = value.trim();
    let nickname = contact.replace(/^@/, "");

    if (contact.includes("/") || /^[a-z][a-z\d+.-]*:/i.test(contact)) {
        try {
            const url = new URL(/^https?:\/\//i.test(contact) ? contact : `https://${contact}`);
            if (
                !["http:", "https:"].includes(url.protocol) ||
                !hosts.includes(url.hostname) ||
                url.username ||
                url.password ||
                url.port
            ) {
                return null;
            }
            const profilePath = url.pathname.match(/^\/([^/]+)\/?$/);
            if (!profilePath) return null;
            nickname = profilePath[1];
        } catch {
            return null;
        }
    }

    return nicknamePattern.test(nickname) ? `https://${hosts[0]}/${nickname}` : null;
}

export const SocialContact = ({ label, value }: SocialContactProps) => {
    const href = getProfileUrl(label, value);

    return (
        <div className="flex items-center gap-2 text-sm text-gray-700">
            <Icon
                name={label.toLowerCase() === "telegram" ? "telegram" : "vk"}
                size={14}
                className="text-gray-400"
            />
            {href ? (
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-app-blue hover:underline focus-visible:underline underline-offset-2"
                >
                    {value}
                </a>
            ) : (
                <span>{value}</span>
            )}
        </div>
    );
};
