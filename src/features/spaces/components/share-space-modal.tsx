import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input/input";
import { RadioGroup, type RadioOption } from "@/components/ui/radio-group/radio-group";
import { useInviteLinks, useCreateInviteLink, useRevokeInviteLink } from "@/lib/spaces";
import { useRoles, ROLE_LABELS, roleLabel } from "@/lib/roles";
import { Copy, Check, Link2, Trash2 } from "lucide-react";
import type { InviteLinkResponse } from "@/types/api";

interface ShareSpaceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    spaceId: number;
}

export const ShareSpaceModal = ({ open, onOpenChange, spaceId }: ShareSpaceModalProps) => {
    const { data: rolesData } = useRoles();
    const roles = rolesData?.items ?? [];
    const roleOptions: RadioOption[] = roles.map((role) => ({
        value: String(role.id),
        label: ROLE_LABELS[role.name] ?? role.name,
    }));

    const { data, isLoading: isLinksLoading } = useInviteLinks(spaceId, open);
    const links = data?.links ?? [];
    const createLink = useCreateInviteLink();
    const revokeLink = useRevokeInviteLink();
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState("");

    useEffect(() => {
        if (open) {
            setCopiedToken(null);
            const memberRole = roles.find((role) => role.name === "member");
            setSelectedRole(memberRole ? String(memberRole.id) : "");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleGenerate = () => {
        if (!selectedRole) return;
        createLink.mutate({ id: spaceId, data: { role_id: Number(selectedRole) } });
    };

    const handleCopy = async (link: InviteLinkResponse) => {
        try {
            await navigator.clipboard.writeText(link.url);
            setCopiedToken(link.token);
            setTimeout(() => setCopiedToken(null), 2000);
        } catch {
            const el = document.createElement("textarea");
            el.value = link.url;
            document.body.appendChild(el);
            el.select();
            document.execCommand("copy");
            document.body.removeChild(el);
            setCopiedToken(link.token);
            setTimeout(() => setCopiedToken(null), 2000);
        }
    };

    const handleRevoke = (token: string) => {
        revokeLink.mutate({ id: spaceId, token });
    };

    const isPending = createLink.isPending || revokeLink.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Поделиться пространством</DialogTitle>
                </DialogHeader>
                <div className="space-y-5">
                    {/* Role section */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            Роль по приглашению
                        </h3>
                        <p className="text-xs text-gray-500 mb-3">
                            Роль будет автоматически назначена при вступлении по ссылке
                        </p>
                        <RadioGroup
                            options={roleOptions}
                            value={selectedRole}
                            onValueChange={setSelectedRole}
                            name="invite_role"
                        />
                    </div>

                    <hr className="border-gray-100" />

                    {/* Links section */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            Ссылки для приглашения
                        </h3>

                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="dark"
                                size="hug36"
                                onClick={handleGenerate}
                                disabled={isPending || !selectedRole}
                                className="flex items-center gap-2"
                            >
                                <Link2 size={16} />
                                {createLink.isPending ? "Создание..." : "Создать ссылку"}
                            </Button>
                            <span className="text-xs text-gray-400">
                                Активных ссылок: {links.length}
                            </span>
                        </div>

                        {isLinksLoading ? (
                            <div className="text-sm text-gray-400 py-2">Загрузка...</div>
                        ) : links.length === 0 ? (
                            <div className="mt-4 text-sm text-gray-500 py-4 text-center border border-dashed border-gray-200 rounded-lg">
                                Создайте ссылку, чтобы пригласить участников в пространство
                            </div>
                        ) : (
                            <div className="mt-4 space-y-3">
                                {links.map((link) => (
                                    <div
                                        key={link.token}
                                        className="border border-gray-200 rounded-lg p-3 space-y-2"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-semibold text-gray-700">
                                                {(() => {
                                                    const role = roles.find(
                                                        (r) => r.id === link.role_id,
                                                    );
                                                    return role
                                                        ? roleLabel(role)
                                                        : `Роль ${link.role_id}`;
                                                })()}
                                            </span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-gray-400">
                                                    Переходов: {link.use_count}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRevoke(link.token)}
                                                    disabled={isPending}
                                                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                                                >
                                                    <Trash2 size={13} />
                                                    Отозвать
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                value={link.url}
                                                readOnly
                                                className="text-sm text-gray-600 bg-gray-50 border-gray-200 cursor-default"
                                                onClick={(e) =>
                                                    (e.target as HTMLInputElement).select()
                                                }
                                            />
                                            <Button
                                                type="button"
                                                variant="blue"
                                                size="hug36"
                                                onClick={() => handleCopy(link)}
                                                disabled={isPending}
                                                className="flex items-center gap-1.5 whitespace-nowrap"
                                            >
                                                {copiedToken === link.token ? (
                                                    <Check size={16} />
                                                ) : (
                                                    <Copy size={16} />
                                                )}
                                                {copiedToken === link.token
                                                    ? "Скопировано"
                                                    : "Копировать"}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pt-2 border-t border-gray-100">
                        <Button
                            type="button"
                            variant="dark"
                            size="hug36"
                            onClick={() => onOpenChange(false)}
                        >
                            Готово
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
