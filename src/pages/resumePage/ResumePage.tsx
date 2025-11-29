import './ResumePage.css';
import { BasePage } from '../../components/mainPage_components/BasePage';

export function ResumePage() {
  return (
    <BasePage>
      <div className="page-content">
        <div className="page-header">
          <h1>Резюме</h1>
          <p>Управление вашим резюме и профессиональной информацией</p>
        </div>
        <div className="resume-container">
          <div className="placeholder">
            <h3>📄 Страница резюме</h3>
            <p>Здесь будет функционал для создания и редактирования резюме</p>
          </div>
        </div>
      </div>
    </BasePage>
  );
}