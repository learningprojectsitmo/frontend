import { Routes, Route } from 'react-router';
import './App.css'
import React, { useContext, useEffect } from 'react'
import { LoginPage } from './pages/login/LoginPage'
import { HomePage } from './pages/home/HomePage'
import { Context } from './main';
import { observer } from 'mobx-react-lite'

const App: React.FC = () => {

  const {store} =useContext(Context);

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
  //<Route index element={<LoginPage />} />
  return (
    <>
      <Routes>
        
        <Route path="homepage" element={<HomePage />} />
        <Route path="" element={<></>} />
      </Routes>
    </>
  )
}

export default observer(App)
