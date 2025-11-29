import './BasePage.css';
import { Sider } from './Sider';
import { Header } from './Header'
import type { ReactNode } from 'react';

interface BasePageProps {
  children?: ReactNode;
}

export function BasePage({ children }: BasePageProps) {
  return (
    <div className="outer-wrapper">
      <Sider />
      <div className="header-wrapper">
        <Header />
        <div className="main-content">
          {children}
        </div>
      </div>
    </div>
  );
}