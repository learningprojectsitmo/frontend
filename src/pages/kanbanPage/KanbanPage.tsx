import './KanbanPage.css';
import { BasePage } from '../../components/mainPage_components/BasePage';

export function KanbanPage() {
  return (
    <BasePage>
      <div className="page-content">
        <div className="page-header">
          <h1>Канбан доска</h1>
          <p>Визуальное управление задачами в формате канбан</p>
        </div>
        <div className="kanban-container">
          <div className="placeholder">
            <h3>📊 Канбан доска</h3>
            <p>Здесь будет интерактивная канбан доска для управления задачами</p>
          </div>
        </div>
      </div>
    </BasePage>
  );
}