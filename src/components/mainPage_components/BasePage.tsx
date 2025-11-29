import './BasePage.css';
import { Sider } from './Sider';
import { Header } from './Header'

export function BasePage() {
  return (
    <div className="outer-wrapper">
      <Sider />
      <div className="header-wrapper">
        <Header />
        <div></div>
      </div>
    </div>
  );
}