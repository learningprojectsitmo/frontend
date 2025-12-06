import { Routes, Route } from 'react-router';
import './App.css'
import React, { useContext, useEffect } from 'react'
import { LoginPage } from './pages/login/LoginPage'
import { Context } from './main';
import { observer } from 'mobx-react-lite'

import { HomePage } from './pages/homePage/HomePage'
import { PersonasPage } from './pages/personasPage/PersonasPage'
import { ResumePage } from './pages/resumePage/ResumePage'
import { ProjectsPage } from './pages/projectsPage/ProjectsPage';
import { ApplicationsPage } from './pages/applicationsPage/ApplicationsPage';
import { TasksPage } from './pages/tasksPage/TasksPage';
import { KanbanPage } from './pages/kanbanPage/KanbanPage';


const App: React.FC = () => {

  const {store} = useContext(Context);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      store.checkAuth()
    }
  }, [])

  if (store.isLoading) {
    return <div>Загрузка...</div>
  }

  if (!store.isAuth) {
    return (
      <LoginPage />
    )
  }

  return (
    <>
      <Routes>
        <Route index path="" element={<HomePage />} />
        <Route path="/personas" element={<PersonasPage />} />
        <Route path="/resume" element={<ResumePage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/kanban" element={<KanbanPage />} />
      </Routes>
    </>
  )
}

export default observer(App)
