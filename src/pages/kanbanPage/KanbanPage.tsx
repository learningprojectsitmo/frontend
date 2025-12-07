import './KanbanPage.css';
import '../pages.css'
import { Sider } from '../../components/mainPage_components/Sider';
import { Header } from '../../components/mainPage_components/Header'

export function KanbanPage() {
  return (
    <div className="outer-wrapper">
      <Sider navbarOption={7}/>
      <div className="header-wrapper">
        <Header pageName="Канбан" profileName="Иванов Иван"/>
        <div></div>
      </div>
    </div>
  );
}