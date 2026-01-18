import './ProjectsPage.css';
import '../pages.css'
import { DefaultPageScreen } from '../../../shared/components/screens/DefaultPageScreen';
import { useState } from 'react';
import { PaginationBlock } from '../../../shared/components/pagination/Pagination';

export function ProjectsPage() {
  const queryParams = new URLSearchParams(window.location.search)
  const searchParam = queryParams.get("search") || ''
  const [page, setPage] = useState(Number(queryParams.get("page")) || 1)
  
  return (
    <DefaultPageScreen pageName='Проекты' profileName='Иванов Иван' navbarOption={4}>
      <div className="content-wrapper">
        <PaginationBlock page={page} setPage={setPage} pageName={"projects"}/>
      </div>
    </DefaultPageScreen>
  );
}