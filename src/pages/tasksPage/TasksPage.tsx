import './TasksPage.css';
import '../pages.css'
import { Sider } from '../../components/mainPage_components/Sider';
import { Header } from '../../components/mainPage_components/Header'

export function TasksPage() {
  return (
    <div className="outer-wrapper">
      <Sider navbarOption={6}/>
      <div className="header-wrapper">
        <Header pageName="ТЗ" profileName="Иванов Иван"/>
        <div></div>
      </div>
    </div>
  );
}