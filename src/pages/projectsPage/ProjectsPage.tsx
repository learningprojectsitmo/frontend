import './ProjectsPage.css';
import '../pages.css'
import { Sider } from '../../components/mainPage_components/Sider';
import { Header } from '../../components/mainPage_components/Header'

export function ProjectsPage() {
  return (
    <div className="outer-wrapper">
      <Sider navbarOption={4}/>
      <div className="header-wrapper">
        <Header pageName="Проекты" profileName="Иванов Иван"/>
        <div></div>
      </div>
    </div>
  );
}