import { Routes, Route } from 'react-router';
import './App.css'
import React, { useContext, useEffect } from 'react'
import { LoginPage } from './pages/login/LoginPage'
import { Context } from './main';
import { observer } from 'mobx-react-lite'

import { HomePage } from './pages/homepage/HomePage'
import { PersonasPage } from './pages/personaspage/PersonasPage'
import { ResumePage } from './pages/resumepage/ResumePage'
import { ProjectsPage } from './pages/projectspage/ProjectsPage';
import { ApplicationsPage } from './pages/applicationspage/ApplicationsPage';
import { TasksPage } from './pages/taskspage/TasksPage';
import { KanbanPage } from './pages/kanbanpage/KanbanPage';
import { CreateUserPage } from './pages/createuserpage/CreateUserPage'


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

  // if (!store.isAuth) {
  //   return (
  //     <LoginPage />
  //   )
  // }

  return (
    <>
      <Routes>
        <Route index path="" element={<HomePage />} />
        <Route path="personas" element={<PersonasPage />} />
        <Route path="personas/create" element={<CreateUserPage />} />
        <Route path="resume" element={<ResumePage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="kanban" element={<KanbanPage />} />
      </Routes>
    </>
  )
}

export default observer(App)
