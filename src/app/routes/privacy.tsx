import { Link } from "react-router";

import { Head } from "@/components/seo";
import { Button } from "@/components/ui/button/button";
import { paths } from "@/config/paths";
import { CookieConsentSettingsButton } from "@/features/privacy/cookie-consent-provider";

const PrivacyRoute = () => (
    <div className="min-h-screen bg-app-background text-[--app-text]">
        <Head
            title="Политика конфиденциальности"
            description="Информация об обработке персональных данных и использовании cookie"
        />
        <header className="border-b border-[--color-black-10] bg-app-surface">
            <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
                <Link to={paths.home.path} className="text-lg font-semibold text-[--grey-4]">
                    EduFlow
                </Link>
                <Link
                    to={paths.home.path}
                    className="text-sm font-semibold text-[--azure-54] hover:underline"
                >
                    На главную
                </Link>
            </div>
        </header>
        <main className="mx-auto max-w-4xl px-6 py-10 sm:py-14">
            <div className="rounded-2xl border border-[--color-black-10] bg-app-surface p-6 sm:p-10">
                <p className="text-sm font-semibold text-[--azure-54]">Черновик</p>
                <h1 className="mt-2 text-3xl font-bold text-[--grey-4]">
                    Политика конфиденциальности
                </h1>
                <p className="mt-4 text-sm leading-6 text-[--azure-46]">
                    Документ подготовлен для технического описания сервиса. Перед публикацией
                    необходимо указать реальные реквизиты оператора, контакты и проверить текст с
                    юристом.
                </p>
            </div>

            <div className="mt-8 space-y-8 rounded-2xl border border-[--color-black-10] bg-app-surface p-6 sm:p-10">
                <section>
                    <h2 className="text-xl font-semibold text-[--grey-4]">1. Общие положения</h2>
                    <p className="mt-3 text-sm leading-6 text-[--azure-46]">
                        Настоящая политика описывает обработку данных при использовании платформы
                        EduFlow. Оператором персональных данных является:{" "}
                        <strong className="font-semibold text-[--grey-27]">
                            [указать наименование, ИНН/ОГРН и адрес]
                        </strong>
                        .
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-[--grey-4]">
                        2. Какие данные обрабатываются
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-[--azure-46]">
                        В зависимости от используемых функций платформа может обрабатывать адрес
                        электронной почты, имя, фамилию, отчество, контакты, сведения о профиле,
                        проектах, командах, задачах и пользовательской активности. Пароль передаётся
                        для регистрации и не хранится в открытом виде.
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[--azure-46]">
                        Специальные категории персональных данных и биометрические данные платформа
                        не запрашивает. Перечень и цели обработки должны быть подтверждены
                        оператором до публикации.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-[--grey-4]">
                        3. Цели и основания обработки
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-[--azure-46]">
                        Данные используются для создания аккаунта, оказания сервиса, обработки
                        запросов, связи с пользователем, обеспечения безопасности и выполнения
                        требований законодательства. Правовые основания для каждой цели должны быть
                        указаны оператором с учётом применимого законодательства.
                    </p>
                </section>

                <section id="cookies">
                    <h2 className="text-xl font-semibold text-[--grey-4]">
                        4. Cookie и локальное хранилище
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-[--azure-46]">
                        Необходимые данные обеспечивают авторизацию, регистрацию и сохранение выбора
                        пользователя. Функциональные, аналитические и диагностические категории
                        можно изменить в настройках cookie.
                    </p>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-[--color-black-10] text-[--grey-27]">
                                    <th className="px-3 py-3 font-semibold">Название</th>
                                    <th className="px-3 py-3 font-semibold">Назначение</th>
                                    <th className="px-3 py-3 font-semibold">Категория</th>
                                </tr>
                            </thead>
                            <tbody className="text-[--azure-46]">
                                <tr className="border-b border-[--color-black-10]">
                                    <td className="px-3 py-3">refresh_token</td>
                                    <td className="px-3 py-3">Поддержание сеанса авторизации</td>
                                    <td className="px-3 py-3">Необходимые</td>
                                </tr>
                                <tr className="border-b border-[--color-black-10]">
                                    <td className="px-3 py-3">register</td>
                                    <td className="px-3 py-3">
                                        Промежуточное состояние регистрации
                                    </td>
                                    <td className="px-3 py-3">Необходимые</td>
                                </tr>
                                <tr className="border-b border-[--color-black-10]">
                                    <td className="px-3 py-3">eduflow_cookie_consent</td>
                                    <td className="px-3 py-3">Сохранение выбора пользователя</td>
                                    <td className="px-3 py-3">Необходимые</td>
                                </tr>
                                <tr className="border-b border-[--color-black-10]">
                                    <td className="px-3 py-3">
                                        app-theme, recently_viewed_project_ids
                                    </td>
                                    <td className="px-3 py-3">
                                        Тема оформления и недавно просмотренные проекты
                                    </td>
                                    <td className="px-3 py-3">Функциональные</td>
                                </tr>
                                <tr className="border-b border-[--color-black-10]">
                                    <td className="px-3 py-3">Яндекс Метрика</td>
                                    <td className="px-3 py-3">
                                        Статистика посещаемости и навигации
                                    </td>
                                    <td className="px-3 py-3">Аналитические</td>
                                </tr>
                                <tr>
                                    <td className="px-3 py-3">Sentry/GlitchTip</td>
                                    <td className="px-3 py-3">
                                        Технические ошибки и диагностика приложения
                                    </td>
                                    <td className="px-3 py-3">Диагностические</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[--azure-46]">
                        До получения согласия аналитические и диагностические сервисы не
                        запускаются. Выбор можно изменить в любой момент.
                    </p>
                    <div className="mt-5">
                        <CookieConsentSettingsButton variant="outline" size="hug36" />
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-[--grey-4]">5. Права пользователя</h2>
                    <p className="mt-3 text-sm leading-6 text-[--azure-46]">
                        Пользователь может запросить доступ к своим данным, их исправление или
                        удаление, отозвать согласие на обработку, а также ограничить или прекратить
                        обработку в пределах, установленных законом. Для обращения необходимо
                        использовать контакты оператора: [указать email и/или почтовый адрес].
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-[--grey-4]">6. Контакты</h2>
                    <p className="mt-3 text-sm leading-6 text-[--azure-46]">
                        Ответственный за обработку персональных данных: [указать ФИО или должность].
                        Контактный адрес: [указать адрес], email: [указать email].
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-[--grey-4]">7. Изменения политики</h2>
                    <p className="mt-3 text-sm leading-6 text-[--azure-46]">
                        Оператор вправе обновлять настоящую политику. Новая редакция и дата её
                        вступления в силу должны быть опубликованы на этой странице.
                    </p>
                </section>
            </div>
            <div className="mt-8 text-center">
                <Button asChild variant="outline" size="hug48">
                    <Link to={paths.home.path}>Вернуться на главную</Link>
                </Button>
            </div>
        </main>
    </div>
);

export default PrivacyRoute;
