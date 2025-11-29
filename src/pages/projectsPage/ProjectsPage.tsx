import './ProjectsPage.css';
import { BasePage } from '../../components/mainPage_components/BasePage';

export function ProjectsPage() {
  return (
    <BasePage>
      <div className="page-content">
        <div className="page-header">
          <h1>Проекты</h1>
          <p>Управление вашими проектами и портфолио</p>
        </div>
        <div className="projects-container">
          <div className="placeholder">
            <h3>🚀 Страница проектов</h3>
            <p>Здесь будет функционал для создания и управления проектами</p>
          </div>
        </div>
      </div>
    </BasePage>
  );
}