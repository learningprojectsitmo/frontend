import './ProjectsPage.css';
import '../pages.css'
import { DefaultPageScreen } from '../../../shared/components/screens/DefaultPageScreen';

export function ProjectsPage() {
  return (
    <DefaultPageScreen pageName='Проекты' profileName='Иванов Иван' navbarOption={4}>
      <div></div>
    </DefaultPageScreen>
  );
}