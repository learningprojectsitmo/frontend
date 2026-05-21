import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input/input";
import { RadioGroup, type RadioOption } from "@/components/ui/radio-group/radio-group";
import { useCreateInviteLink, useInviteLink, useRevokeInviteLink } from "@/lib/spaces";
import { Copy, Check } from "lucide-react";

interface ShareSpaceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    spaceId: number;
}

const roleOptions: RadioOption[] = [
    { value: "2", label: "Участник" },
    { value: "3", label: "Руководитель проекта" },
    { value: "1", label: "Администратор" },
];

export const ShareSpaceModal = ({ open, onOpenChange, spaceId }: ShareSpaceModalProps) => {
    const { data: inviteLink, isLoading, refetch } = useInviteLink(spaceId);
    const createLink = useCreateInviteLink();
    const revokeLink = useRevokeInviteLink();
    const [copied, setCopied] = useState(false);
    const [selectedRole, setSelectedRole] = useState("2");

    useEffect(() => {
        if (open) {
            setCopied(false);
            setSelectedRole("2");
            refetch().catch(() => {});
        }
    }, [open, refetch]);

    useEffect(() => {
        if (open && !inviteLink && !isLoading) {
            createLink.mutate({ id: spaceId, data: { role_id: Number(selectedRole) } });
        }
    }, [open, inviteLink, isLoading, spaceId, createLink, selectedRole]);

    const handleCopy = async () => {
        if (!inviteLink?.url) return;
        try {
            await navigator.clipboard.writeText(inviteLink.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
            const el = document.createElement("textarea");
            el.value = inviteLink.url;
            document.body.appendChild(el);
            el.select();
            document.execCommand("copy");
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleRoleChange = (value: string) => {
        setSelectedRole(value);
        createLink.mutate({ id: spaceId, data: { role_id: Number(value) } });
    };

    const handleRevoke = () => {
        revokeLink.mutate(spaceId, {
            onSuccess: () => {
                refetch().catch(() => {});
            },
        });
    };

    const isPending = createLink.isPending || revokeLink.isPending;

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
            title="Поделиться пространством"
            className="max-w-md"
        >
            <div className="space-y-5">
                {/* Role section */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        Роль по приглашению
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                        Роль будет автоматически назначена при вступлении по ссылке
                    </p>
                    <p className="text-xs font-medium text-gray-700 mb-2">Роль участника</p>
                    <RadioGroup
                        options={roleOptions}
                        value={selectedRole}
                        onValueChange={handleRoleChange}
                        name="invite_role"
                    />
                </div>

                <hr className="border-gray-100" />

                {/* Link section */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        Ссылка для приглашения
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                        Скопируйте ссылку и отправьте ее участникам
                    </p>

                    {isLoading && !inviteLink ? (
                        <div className="h-10 bg-gray-50 rounded-lg animate-pulse" />
                    ) : inviteLink ? (
                        <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                                <Input
                                    value={inviteLink.url}
                                    readOnly
                                    className="pr-2 text-sm text-gray-600 bg-gray-50 border-gray-200 cursor-default"
                                    onClick={(e) => (e.target as HTMLInputElement).select()}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="blue"
                                size="hug36"
                                onClick={handleCopy}
                                disabled={isPending}
                                className="flex items-center gap-1.5 whitespace-nowrap"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? "Скопировано" : "Копировать"}
                            </Button>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">Не удалось создать ссылку</p>
                    )}

                    {inviteLink && (
                        <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-gray-400">
                                Переходов: {inviteLink.use_count}
                            </span>
                            <button
                                type="button"
                                onClick={handleRevoke}
                                disabled={isPending}
                                className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                            >
                                Отозвать ссылку
                            </button>
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
        </Dialog>
    );
};
