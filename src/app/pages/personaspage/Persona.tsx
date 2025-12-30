import "./Persona.css";
import type { IUser } from "../../../shared/types/entities/User";

interface PersonaProps {
    user: IUser;
}

export function Persona({ user }: PersonaProps) {
    // Формируем ФИО в правильном порядке
    const getFullName = () => {
        const parts = [];
        if (user.last_name) parts.push(user.last_name);
        if (user.first_name) parts.push(user.first_name);
        if (user.middle_name) parts.push(user.middle_name);
        return parts.join(" ");
    };

    // Формируем отображаемый email (если есть)
    const getDisplayEmail = () => {
        return user.email || "Email не указан";
    };

    return (
        <div className="persona-card">
            <div className="persona-header">
                <div className="persona-avatar">
                    <div className="avatar-placeholder">
                        {user.first_name ? user.first_name.charAt(0).toUpperCase() : "?"}
                    </div>
                </div>
                <div className="persona-basic-info">
                    <h3 className="persona-name">{getFullName() || "Имя не указано"}</h3>
                    <p className="persona-email">{getDisplayEmail()}</p>
                </div>
            </div>

            <div className="persona-details">
                <div className="detail-item">
                    <span className="detail-icon">🎓</span>
                    <span className="detail-label">ИСУ:</span>
                    <span className="detail-value">{user.isu_number || "Не указан"}</span>
                </div>

                <div className="detail-item">
                    <span className="detail-icon">📧</span>
                    <span className="detail-label">Email:</span>
                    <span className="detail-value email-value">{user.email || "Не указан"}</span>
                </div>

                {user.tg_nickname && (
                    <div className="detail-item">
                        <span className="detail-icon">💬</span>
                        <span className="detail-label">Telegram:</span>
                        <span className="detail-value">@{user.tg_nickname}</span>
                    </div>
                )}
            </div>

            <div className="persona-actions">
                <button className="action-button primary">
                    <span className="button-icon">👤</span>
                    Профиль
                </button>
                <button className="action-button secondary">
                    <span className="button-icon">💬</span>
                    Написать
                </button>
            </div>
        </div>
    );
}
