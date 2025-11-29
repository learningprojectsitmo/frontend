import './ApplicationsPage.css';
import { BasePage } from '../../components/mainPage_components/BasePage';

export function ApplicationsPage() {
  return (
    <BasePage>
      <div className="page-content">
        <div className="page-header">
          <h1>Заявки</h1>
          <p>Управление заявками на работу и стажировки</p>
        </div>
        <div className="applications-container">
          <div className="placeholder">
            <h3>📝 Страница заявок</h3>
            <p>Здесь будет функционал для отслеживания заявок на работу</p>
          </div>
        </div>
      </div>
    </BasePage>
  );
}