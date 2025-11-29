import './PersonasPage.css';
import { BasePage } from '../../components/mainPage_components/BasePage';

export function PersonasPage() {
  return (
    <BasePage>
      <div className="page-content">
        <div className="page-header">
          <h1>Персоны</h1>
          <p>Управление пользовательскими персонами и профилями</p>
        </div>
        <div className="personas-container">
          <div className="placeholder">
            <h3>👥 Страница персон</h3>
            <p>Здесь будет функционал для создания и управления пользовательскими персонами</p>
          </div>
        </div>
      </div>
    </BasePage>
  );
}