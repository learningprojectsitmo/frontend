import './TasksPage.css';
import { BasePage } from '../../components/mainPage_components/BasePage';

export function TasksPage() {
  return (
    <BasePage>
      <div className="page-content">
        <div className="page-header">
          <h1>Задачи</h1>
          <p>Управление вашими задачами и проектами</p>
        </div>
        <div className="tasks-container">
          <div className="placeholder">
            <h3>📋 Страница задач</h3>
            <p>Здесь будет функционал для создания, редактирования и управления задачами</p>
          </div>
        </div>
      </div>
    </BasePage>
  );
}