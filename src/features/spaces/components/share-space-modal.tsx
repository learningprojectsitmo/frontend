import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input/input";
import { RadioGroup, type RadioOption } from "@/components/ui/radio-group/radio-group";
import { useInviteLink, useCreateInviteLink, useRevokeInviteLink } from "@/lib/spaces";
import { Copy, Check, Link2 } from "lucide-react";
import type { InviteLinkResponse } from "@/types/api";

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
    const { data: existingLink, isLoading: isLinkLoading } = useInviteLink(spaceId, open);
    const createLink = useCreateInviteLink();
    const revokeLink = useRevokeInviteLink();
    const [copied, setCopied] = useState(false);
    const [selectedRole, setSelectedRole] = useState("2");
    const [generatedLink, setGeneratedLink] = useState<InviteLinkResponse | null>(null);

    useEffect(() => {
        if (open) {
            if (existingLink) {
                setGeneratedLink(existingLink);
            }
            setCopied(false);
        }
    }, [open, existingLink]);

    const handleGenerate = () => {
        createLink.mutate(
            { id: spaceId, data: { role_id: Number(selectedRole) } },
            {
                onSuccess: (data) => {
                    setGeneratedLink(data);
                },
            },
        );
    };

    const handleCopy = async () => {
        if (!generatedLink?.url) return;
        try {
            await navigator.clipboard.writeText(generatedLink.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const el = document.createElement("textarea");
            el.value = generatedLink.url;
            document.body.appendChild(el);
            el.select();
            document.execCommand("copy");
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleRevoke = () => {
        revokeLink.mutate(spaceId, {
            onSuccess: () => {
                setGeneratedLink(null);
            },
        });
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setGeneratedLink(null);
            setCopied(false);
            setSelectedRole("2");
        }
        onOpenChange(open);
    };

    const isPending = createLink.isPending || revokeLink.isPending;
    const hasLink = !!generatedLink;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
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
                        <p className="text-xs font-medium text-gray-700 mb-2">Роль участника</p>
                        <RadioGroup
                            options={roleOptions}
                            value={selectedRole}
                            onValueChange={setSelectedRole}
                            name="invite_role"
                        />
                    </div>

                    <hr className="border-gray-100" />

                    {/* Link section */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            Ссылка для приглашения
                        </h3>

                        {isLinkLoading ? (
                            <div className="text-sm text-gray-400 py-2">Загрузка...</div>
                        ) : !hasLink ? (
                            <div>
                                <p className="text-xs text-gray-500 mb-4">
                                    Создайте ссылку, чтобы пригласить участников в пространство
                                </p>
                                <Button
                                    type="button"
                                    variant="dark"
                                    size="hug36"
                                    onClick={handleGenerate}
                                    disabled={isPending}
                                    className="flex items-center gap-2"
                                >
                                    <Link2 size={16} />
                                    {createLink.isPending ? "Создание..." : "Создать ссылку"}
                                </Button>
                            </div>
                        ) : (
                            <div>
                                <p className="text-xs text-gray-500 mb-3">
                                    Скопируйте ссылку и отправьте ее участникам
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 relative">
                                        <Input
                                            value={generatedLink.url}
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

                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-xs text-gray-400">
                                        Переходов: {generatedLink.use_count}
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
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pt-2 border-t border-gray-100">
                        <Button
                            type="button"
                            variant="dark"
                            size="hug36"
                            onClick={() => handleOpenChange(false)}
                        >
                            Готово
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
