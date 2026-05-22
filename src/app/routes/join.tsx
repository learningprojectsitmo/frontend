import { useNavigate, useSearchParams } from "react-router";
import { Head } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner/spinner";
import { useUser } from "@/lib/auth";
import { useJoinByLink } from "@/lib/spaces";
import { paths } from "@/config/paths";

const JoinRoute = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";
    const navigate = useNavigate();
    const { data: user, isLoading: isAuthLoading } = useUser();
    const joinMutation = useJoinByLink();

    const handleJoin = () => {
        if (!token) return;
        joinMutation.mutate(token, {
            onSuccess: (data) => {
                navigate(paths.app.space.getHref(data.workspace_id));
            },
        });
    };

    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <>
            <Head title="Присоединение к пространству" />
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                    <div className="mb-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg
                                className="w-8 h-8 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-xl font-semibold text-gray-900 mb-2">
                            Присоединение к пространству
                        </h1>
                    </div>

                    {!token ? (
                        <div className="mb-6">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm text-red-700">
                                    Недействительная ссылка. Пожалуйста, проверьте ссылку и
                                    попробуйте снова.
                                </p>
                            </div>
                        </div>
                    ) : !user ? (
                        <div>
                            <p className="text-sm text-gray-600 mb-6">
                                Чтобы присоединиться к пространству, войдите или зарегистрируйтесь.
                            </p>
                            <div className="flex flex-col gap-3">
                                <Button
                                    variant="dark"
                                    size="fill48"
                                    onClick={() =>
                                        navigate(
                                            paths.auth.login.getHref(
                                                `/join?token=${encodeURIComponent(token)}`,
                                            ),
                                        )
                                    }
                                >
                                    Войти
                                </Button>
                                <Button
                                    variant="outline"
                                    size="fill48"
                                    onClick={() =>
                                        navigate(
                                            paths.auth.createAcc.getHref(
                                                `/join?token=${encodeURIComponent(token)}`,
                                            ),
                                        )
                                    }
                                >
                                    Регистрация
                                </Button>
                            </div>
                        </div>
                    ) : joinMutation.isSuccess ? (
                        <div>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                                <p className="text-sm text-green-700 font-medium">
                                    Вы успешно присоединились к пространству!
                                </p>
                            </div>
                            <Button
                                variant="dark"
                                size="hug36"
                                onClick={() =>
                                    navigate(
                                        paths.app.space.getHref(joinMutation.data.workspace_id),
                                    )
                                }
                            >
                                Перейти в пространство
                            </Button>
                        </div>
                    ) : (
                        <div>
                            {joinMutation.isError ? (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                    <p className="text-sm text-red-700">
                                        {joinMutation.error instanceof Error
                                            ? "Ссылка недействительна или истекла"
                                            : "Произошла ошибка"}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-600 mb-6">
                                    Вы хотите присоединиться к этому пространству?
                                </p>
                            )}
                            <Button
                                variant="dark"
                                size="hug36"
                                onClick={handleJoin}
                                disabled={joinMutation.isPending}
                            >
                                {joinMutation.isPending ? "Присоединение..." : "Присоединиться"}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default JoinRoute;
